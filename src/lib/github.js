import { API_BASE, RAW_BASE, REPO, CACHE_TTL_MS } from '../config'

export class RateLimitError extends Error {
  constructor() {
    super("Melvin's files are resting. Try again in a few minutes.")
    this.name = 'RateLimitError'
  }
}

const mem = new Map()

function storageGet(key) {
  try {
    const raw = sessionStorage.getItem(`melvinos:${key}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function storageSet(key, entry) {
  try {
    sessionStorage.setItem(`melvinos:${key}`, JSON.stringify(entry))
  } catch {
    /* private mode / quota — memory cache still works */
  }
}

async function cached(key, fetcher) {
  const now = Date.now()
  const hit = mem.get(key) ?? storageGet(key)
  if (hit && now - hit.t < CACHE_TTL_MS) {
    mem.set(key, hit)
    return hit.data
  }
  try {
    const data = await fetcher()
    const entry = { t: now, data }
    mem.set(key, entry)
    storageSet(key, entry)
    return data
  } catch (err) {
    // Serve stale data over an error if we have any
    if (hit) return hit.data
    throw err
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// GitHub's burst limiting returns 403s without CORS headers, which surface as
// TypeError('Failed to fetch'). Retry once, then present it as the files resting.
async function resilientFetch(url, options) {
  for (let attempt = 0; ; attempt++) {
    let res
    try {
      res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(8000),
      })
    } catch (err) {
      if (attempt === 0) {
        await sleep(800)
        continue
      }
      throw new RateLimitError()
    }
    if (res.status === 403 || res.status === 429) throw new RateLimitError()
    if (res.status >= 500 && attempt === 0) {
      await sleep(800)
      continue
    }
    return res
  }
}

async function apiJSON(url) {
  const res = await resilientFetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  return res.json()
}

/** List a directory inside melvin/. Pass '' for the root. */
export function listDir(path = '') {
  const full = path ? `${REPO.root}/${path}` : REPO.root
  return cached(`dir:${full}`, async () => {
    const items = await apiJSON(`${API_BASE}/contents/${full}?ref=${REPO.branch}`)
    return items
      .map((it) => ({
        name: it.name,
        path: it.path.replace(`${REPO.root}/`, ''),
        fullPath: it.path,
        type: it.type, // 'file' | 'dir'
        size: it.size,
      }))
      .sort((a, b) =>
        a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1
      )
  })
}

/** Raw text of a file inside melvin/. */
export function getFileText(path) {
  return cached(`file:${path}`, async () => {
    const res = await resilientFetch(`${RAW_BASE}/${REPO.root}/${path}`)
    if (!res.ok) throw new Error(`raw ${res.status}`)
    return res.text()
  })
}

export function rawURL(path) {
  return `${RAW_BASE}/${REPO.root}/${path}`
}

/** Commits touching melvin/ (or a subpath). Newest first. */
export function getCommits(path = '', perPage = 30) {
  const full = path ? `${REPO.root}/${path}` : REPO.root
  return cached(`commits:${full}:${perPage}`, async () => {
    const commits = await apiJSON(
      `${API_BASE}/commits?path=${encodeURIComponent(full)}&per_page=${perPage}`
    )
    return commits.map((c) => ({
      sha: c.sha.slice(0, 7),
      date: c.commit.author?.date ?? c.commit.committer?.date,
      message: c.commit.message,
    }))
  })
}

/** Approximate arrival date: oldest commit touching the path (fine while history is young). */
export async function arrivalDate(path) {
  const commits = await getCommits(path, 100)
  return commits.length ? commits[commits.length - 1].date : null
}

/** Every file under melvin/ in one API call (git trees, recursive). Powers search. */
export function getTree() {
  return cached('tree', async () => {
    const data = await apiJSON(`${API_BASE}/git/trees/${REPO.branch}?recursive=1`)
    return data.tree
      .filter((n) => n.type === 'blob' && n.path.startsWith(`${REPO.root}/`))
      .map((n) => ({ path: n.path.slice(REPO.root.length + 1), size: n.size }))
  })
}

/** Search the texts of files already read this session (sessionStorage cache). */
export function searchCachedTexts(query) {
  const q = query.toLowerCase()
  const hits = []
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (!key?.startsWith('melvinos:file:')) continue
      const path = key.slice('melvinos:file:'.length)
      const text = JSON.parse(sessionStorage.getItem(key))?.data
      if (typeof text !== 'string') continue
      const idx = text.toLowerCase().indexOf(q)
      if (idx === -1) continue
      const start = Math.max(0, idx - 40)
      const snippet = (start > 0 ? '…' : '') + text.slice(start, idx + q.length + 60).replace(/\s+/g, ' ') + '…'
      hits.push({ path, snippet })
    }
  } catch {
    /* sessionStorage unavailable — filename search still works */
  }
  return hits
}

export const isMarkdown = (name) => /\.(md|markdown)$/i.test(name)
export const isImage = (name) => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(name)
