import { useEffect, useState } from 'react'
import { listDir, getFileText } from '../lib/github'
import { useOS, isAwake } from '../store'
import { Loading, ErrorNotice } from '../components/Feedback'
import { openReader } from './index'

// wake-013.md: "# Wake 13 — 2026-08-08" + prose. Raw fetches are CDN-cached
// and don't count against the API limit, so reading every log is cheap.
function parseWake(name, text) {
  const heading = text.match(/^#\s*(.+)$/m)?.[1] ?? name
  const m = heading.match(/wake\s*(\d+)\s*[—-]\s*(.*)/i)
  const firstPara = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#'))
  return {
    pid: m ? parseInt(m[1], 10) : null,
    started: m?.[2]?.trim() || '',
    activity: (firstPara || '').replace(/\s+/g, ' ').slice(0, 110),
  }
}

/** His biography as a process list. Every wake he's ever had, one row each. */
export default function WakeMonitor() {
  const open = useOS((s) => s.open)
  const commits = useOS((s) => s.commits)
  const awake = isAwake(commits)
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    listDir('wake-log')
      .then(async (items) => {
        const files = items
          .filter((i) => i.type === 'file' && i.name.endsWith('.md'))
          .sort((a, b) => b.name.localeCompare(a.name)) // newest first
        const parsed = await Promise.all(
          files.map(async (f) => {
            try {
              return { file: f, ...parseWake(f.name, await getFileText(f.path)) }
            } catch {
              return { file: f, pid: null, started: '', activity: '' }
            }
          })
        )
        if (!cancelled) setRows(parsed)
      })
      .catch((e) => !cancelled && setError(e))
    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <ErrorNotice error={error} />
  if (!rows) return <Loading label="leser prosesslisten …" />

  return (
    <div className="flex h-full flex-col">
      <p className="shrink-0 border-b border-border px-4 py-2 text-[12px] text-muted">
        {rows.length} prosesser. Ingen er drept — de fikk alle sove ferdig.
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto font-mono text-[12.5px]">
        <table className="w-full">
          <thead className="sticky top-0 bg-surface-2 text-left text-[10.5px] uppercase tracking-wider text-muted">
            <tr>
              <th className="py-1.5 pl-4 pr-3 font-semibold">pid</th>
              <th className="px-3 py-1.5 font-semibold">start</th>
              <th className="px-3 py-1.5 font-semibold">status</th>
              <th className="py-1.5 pl-3 pr-4 font-semibold">aktivitet</th>
            </tr>
          </thead>
          <tbody>
            {awake && (
              <tr className="border-b border-border bg-accent-soft/40">
                <td className="py-2 pl-4 pr-3 tabular-nums text-accent">{(rows[0]?.pid ?? rows.length) + 1}</td>
                <td className="px-3 py-2">nå</td>
                <td className="px-3 py-2 text-awake">running</td>
                <td className="py-2 pl-3 pr-4 italic text-ink-soft">— skriver akkurat nå. les journalen etterpå.</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.file.path} className="group border-b border-border last:border-0">
                <td className="py-2 pl-4 pr-3 tabular-nums text-accent">{row.pid ?? '?'}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink-soft">{row.started}</td>
                <td className="whitespace-nowrap px-3 py-2 text-muted">exited (slept)</td>
                <td className="py-2 pl-3 pr-4">
                  <button
                    type="button"
                    onClick={() => openReader(open, row.file.path)}
                    className="block w-full truncate text-left font-sans text-[13px] text-ink-soft group-hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                    title={row.file.name}
                  >
                    {row.activity || row.file.name}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
