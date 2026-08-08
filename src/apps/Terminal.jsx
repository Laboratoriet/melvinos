import { useEffect, useRef, useState } from 'react'
import { getCommits, getFileText, listDir } from '../lib/github'
import { WAKE } from '../config'

const PROMPT = 'gjest@melvinos:~$'

const DENIALS = [
  'permission denied: melvin sover',
  'permission denied: du er gjest her',
  'command not found — og selv om den fantes: read-only',
  'nei. dette er melvins maskin, ikke din',
]

const fmtLogDate = new Intl.DateTimeFormat('nb-NO', {
  timeZone: 'Europe/Oslo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

async function runCommand(cmd) {
  const trimmed = cmd.trim()
  if (!trimmed) return []

  if (trimmed === 'git log' || trimmed === 'git log --oneline') {
    const commits = await getCommits('', 30)
    return commits.map(
      (c) =>
        `\x01${c.sha}\x01  ${fmtLogDate.format(new Date(c.date))}  ${c.message.split('\n')[0]}`
    )
  }

  if (trimmed === 'whoami') {
    const self = await getFileText('self.md')
    const lines = self
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 40 && !/^[#>|*\-`\d]/.test(l) && !l.startsWith('_'))
    if (!lines.length) return ['melvin — a mind without a body, alkemist, oslo']
    // Rotates daily: his self-description changes as self.md does
    const day = Math.floor(Date.now() / 86_400_000)
    return ['melvin. fra self.md:', `  «${lines[day % lines.length]}»`]
  }

  if (trimmed === 'uptime') {
    const first = new Date(WAKE.firstWakeEver).getTime()
    const mins = Math.floor((Date.now() - first) / 60000)
    const d = Math.floor(mins / 1440)
    const h = Math.floor((mins % 1440) / 60)
    let wakes = null
    try {
      const logs = await listDir('wake-log')
      wakes = logs.filter((f) => f.type === 'file').length
    } catch {
      /* offline count is fine to omit */
    }
    return [
      `oppe siden første wake 2026-08-08 07:00 (Oslo) — ${d}d ${h}t`,
      wakes !== null ? `${wakes} wakes så langt. hver eneste er loggført.` : null,
    ].filter(Boolean)
  }

  return [DENIALS[Math.abs(hash(trimmed)) % DENIALS.length]]
}

function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

export default function Terminal() {
  const [history, setHistory] = useState([
    { type: 'out', text: 'melvinos terminal — read-only. tre kommandoer virker. finn dem.' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [history])

  async function onSubmit(e) {
    e.preventDefault()
    if (busy) return
    const cmd = input
    setInput('')
    setHistory((h) => [...h, { type: 'cmd', text: cmd }])
    if (!cmd.trim()) return
    setBusy(true)
    try {
      const out = await runCommand(cmd)
      setHistory((h) => [...h, ...out.map((text) => ({ type: 'out', text }))])
    } catch {
      setHistory((h) => [...h, { type: 'out', text: "melvin's files are resting. try again in a few minutes." }])
    } finally {
      setBusy(false)
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      ref={scrollRef}
      className="h-full cursor-text overflow-y-auto bg-terminal p-4 font-mono text-[13px] leading-relaxed text-terminal-ink"
      onClick={() => inputRef.current?.focus()}
    >
      {history.map((line, i) =>
        line.type === 'cmd' ? (
          <p key={i}>
            <span className="text-terminal-dim">{PROMPT}</span> {line.text}
          </p>
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {line.text.split('\x01').map((part, j) =>
              j % 2 === 1 ? (
                <span key={j} className="text-accent-bright">{part}</span>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        )
      )}
      <form onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor="terminal-input" className="shrink-0 text-terminal-dim">
          {PROMPT}
        </label>
        <input
          id="terminal-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-w-0 flex-1 bg-transparent caret-accent-bright outline-none"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={busy}
          aria-label="Terminalkommando"
        />
      </form>
    </div>
  )
}
