import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, FileText, Folder } from 'lucide-react'
import { getTree, searchCachedTexts } from '../lib/github'
import { useOS } from '../store'
import { openReader, APPS } from '../apps'

function scorePath(path, tokens) {
  const p = path.toLowerCase()
  let score = 0
  for (const t of tokens) {
    const idx = p.indexOf(t)
    if (idx === -1) return -1
    score += (idx === 0 || p[idx - 1] === '/' ? 40 : 10) - idx * 0.1
  }
  return score - path.length * 0.05
}

/** Cmd+K: search everything he is. Filenames from the git tree, plus text of files already read. */
export default function SearchOverlay() {
  const searchOpen = useOS((s) => s.searchOpen)
  const setSearchOpen = useOS((s) => s.setSearchOpen)
  const open = useOS((s) => s.open)
  const [query, setQuery] = useState('')
  const [tree, setTree] = useState(null)
  const [treeError, setTreeError] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (!searchOpen) return
    setQuery('')
    setActive(0)
    getTree()
      .then(setTree)
      .catch(() => setTreeError(true))
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [searchOpen])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !tree) return []
    const tokens = q.split(/\s+/)
    const nameHits = tree
      .map((f) => ({ type: 'file', path: f.path, score: scorePath(f.path, tokens) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
    const seen = new Set(nameHits.map((r) => r.path))
    const textHits = q.length >= 3
      ? searchCachedTexts(q)
          .filter((h) => !seen.has(h.path))
          .slice(0, 4)
          .map((h) => ({ type: 'text', ...h }))
      : []
    return [...nameHits, ...textHits]
  }, [query, tree])

  useEffect(() => setActive(0), [results.length, query])

  if (!searchOpen) return null

  function pick(r) {
    setSearchOpen(false)
    if (r.path.startsWith('journal/')) {
      open('journal', {
        title: APPS.journal.title,
        w: APPS.journal.w,
        h: APPS.journal.h,
        props: { initialPath: r.path },
      })
    } else {
      openReader(open, r.path)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') return setSearchOpen(false)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      pick(results[active])
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className="absolute inset-0 z-50 flex items-start justify-center bg-ink/20 pt-[14vh]"
      onMouseDown={(e) => e.target === e.currentTarget && setSearchOpen(false)}
    >
      <div
        role="dialog"
        aria-label="Søk i melvins filer"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border-strong bg-surface shadow-[0_24px_60px_-20px_rgba(43,40,34,0.5)]"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={16} strokeWidth={1.75} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="søk i alt han er …"
            aria-label="Søk"
            className="h-12 min-w-0 flex-1 bg-transparent font-sans text-[15px] outline-none placeholder:text-muted"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">
            esc
          </kbd>
        </div>

        {query.trim() && (
          <ul ref={listRef} className="max-h-[46vh] overflow-y-auto py-1.5">
            {treeError && (
              <li className="px-4 py-3 text-sm text-muted">Melvin's files are resting. Try again in a few minutes.</li>
            )}
            {!treeError && results.length === 0 && (
              <li className="px-4 py-3 font-serif italic text-sm text-ink-soft">
                ingenting med «{query.trim()}» i melvin/ — ennå.
              </li>
            )}
            {results.map((r, i) => (
              <li key={`${r.type}:${r.path}`}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-start gap-3 px-4 py-2 text-left ${
                    i === active ? 'bg-accent-soft/60' : ''
                  }`}
                >
                  {r.type === 'file' ? (
                    <FileText size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-muted" />
                  ) : (
                    <Search size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[12.5px] text-ink">
                      melvin/{r.path}
                    </span>
                    {r.snippet && (
                      <span className="mt-0.5 block truncate font-serif text-[12.5px] italic text-muted">
                        {r.snippet}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
            {!treeError && query.trim().length >= 3 && (
              <li className="border-t border-border px-4 pb-1 pt-2 text-[10.5px] text-muted">
                tekst-treff søker bare i filer du allerede har åpnet
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
