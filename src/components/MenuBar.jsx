import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useOS, isAwake, msUntilNextWake, formatCountdown } from '../store'

const osloClock = new Intl.DateTimeFormat('nb-NO', {
  timeZone: 'Europe/Oslo',
  hour: '2-digit',
  minute: '2-digit',
})

export default function MenuBar() {
  const commits = useOS((s) => s.commits)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(t)
  }, [])

  const awake = isAwake(commits)
  const latest = commits?.[0]

  return (
    <header className="relative z-40 flex h-8 items-center gap-4 border-b border-border bg-surface/85 px-4 text-[13px] backdrop-blur-sm">
      <span className="font-semibold tracking-tight">MelvinOS</span>

      <span className="flex items-center gap-1.5 text-ink-soft">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            awake ? 'bg-awake' : 'bg-border-strong'
          }`}
          aria-hidden="true"
        />
        {awake ? 'våken' : 'sover'}
      </span>

      {!awake && (
        <span className="hidden text-muted sm:inline">
          våkner om {formatCountdown(msUntilNextWake(now))}
        </span>
      )}

      <span className="min-w-0 flex-1" />

      {latest && (
        <span className="hidden min-w-0 items-center gap-2 truncate text-muted md:flex" title={latest.message}>
          <span className="font-mono text-[11px] text-border-strong">{latest.sha}</span>
          <span className="truncate italic">“{latest.message.split('\n')[0]}”</span>
        </span>
      )}

      <button
        type="button"
        onClick={() => useOS.getState().setSearchOpen(true)}
        aria-label="Søk (Cmd+K)"
        title="Søk — ⌘K"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Search size={14} strokeWidth={1.75} />
      </button>

      <time className="shrink-0 font-medium tabular-nums text-ink-soft">
        {osloClock.format(now)}
      </time>
    </header>
  )
}
