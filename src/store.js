import { create } from 'zustand'
import { getCommits } from './lib/github'
import { hashForWindow, writeHash } from './lib/deeplink'
import { WAKE } from './config'

let nextId = 1
let nextZ = 10

const cascade = (n) => 60 + (n % 6) * 32

export const useOS = create((set, get) => ({
  booted: false,
  setBooted: () => set({ booted: true }),

  windows: [],

  /** Open (or focus) a window. `key` dedupes — same key focuses the existing window. */
  open(appId, { key = appId, title, props = {}, w = 900, h = 600 } = {}) {
    const existing = get().windows.find((win) => win.key === key)
    if (existing) {
      if (Object.keys(props).length) {
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === existing.id ? { ...w, props: { ...w.props, ...props } } : w
          ),
        }))
      }
      return get().focus(existing.id)
    }
    writeHash(hashForWindow({ appId, props }))
    const n = get().windows.length
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(w, vw - 48)
    const height = Math.min(h, vh - 96)
    const x = Math.max(16, Math.min(cascade(n) + n * 24, vw - width - 16))
    const y = Math.max(44, Math.min(cascade(n), vh - height - 60))
    set((s) => ({
      windows: [
        ...s.windows,
        { id: nextId++, key, appId, title, props, x, y, w: width, h: height, z: nextZ++ },
      ],
    }))
  },

  close(id) {
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) }))
    const remaining = get().windows
    const top = remaining.reduce((a, b) => (!a || b.z > a.z ? b : a), null)
    writeHash(hashForWindow(top))
  },

  focus(id) {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, z: nextZ++ } : w)),
    }))
    writeHash(hashForWindow(get().windows.find((w) => w.id === id)))
  },

  moveResize(id, patch) {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }))
  },

  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),

  // ---- Melvin's pulse: recent commits drive status dot, ticker, terminal ----
  commits: null,
  commitsError: null,
  async loadCommits() {
    try {
      const commits = await getCommits('', 30)
      set({ commits, commitsError: null })
    } catch (err) {
      if (!get().commits) set({ commitsError: err })
    }
  },
}))

export function isAwake(commits) {
  if (!commits?.length) return false
  const last = new Date(commits[0].date).getTime()
  return Date.now() - last < WAKE.awakeWindowMinutes * 60 * 1000
}

/** Milliseconds until the next scheduled wake. */
export function msUntilNextWake(now = Date.now()) {
  const anchor = new Date(WAKE.anchor).getTime()
  const interval = WAKE.intervalHours * 60 * 60 * 1000
  const elapsed = now - anchor
  const next = anchor + Math.ceil(elapsed / interval) * interval
  return next - now
}

export function formatCountdown(ms) {
  const totalMin = Math.max(1, Math.round(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `~${h}t ${m}m` : `~${m}m`
}
