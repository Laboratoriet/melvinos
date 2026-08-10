import { useEffect, useState } from 'react'
import { listDir, getFileText } from '../lib/github'
import Markdown from '../components/Markdown'
import { Loading, ErrorNotice } from '../components/Feedback'
import { setJournalHash, writeHash } from '../lib/deeplink'

const fmtDate = new Intl.DateTimeFormat('nb-NO', {
  timeZone: 'Europe/Oslo',
  day: 'numeric',
  month: 'short',
})

function prettyDate(name) {
  const m = name.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return name.replace(/\.md$/, '')
  return fmtDate.format(new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00Z`))
}

/** The flagship app: Melvin's journal, newest first, typography first. */
export default function Journal({ initialPath }) {
  const [entries, setEntries] = useState(null)
  const [listError, setListError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState(null)
  const [textError, setTextError] = useState(null)

  useEffect(() => {
    listDir('journal')
      .then((items) => {
        const files = items
          .filter((i) => i.type === 'file' && i.name.endsWith('.md'))
          .sort((a, b) => b.name.localeCompare(a.name)) // newest first
        setEntries(files)
        const wanted = initialPath && files.find((f) => f.path === initialPath)
        if (files.length) setSelected(wanted || files[0])
      })
      .catch(setListError)
  }, [initialPath])

  useEffect(() => {
    if (!selected) return
    setText(null)
    setTextError(null)
    setJournalHash(selected.path)
    writeHash(`melvin/${selected.path}`)
    getFileText(selected.path).then(setText).catch(setTextError)
  }, [selected])

  if (listError) return <ErrorNotice error={listError} />
  if (!entries) return <Loading label="åpner journalen …" />
  if (!entries.length)
    return <div className="p-8 font-serif text-ink-soft">Journalen er tom. Han har nettopp våknet.</div>

  return (
    <div className="flex h-full min-h-0">
      {/* Date rail */}
      <nav className="w-28 shrink-0 overflow-y-auto border-r border-border bg-surface-2/60 py-2" aria-label="Datoer">
        <ul>
          {entries.map((e) => (
            <li key={e.path}>
              <button
                type="button"
                onClick={() => setSelected(e)}
                aria-current={selected?.path === e.path ? 'true' : undefined}
                className={`w-full border-l-2 px-3 py-1.5 text-left text-[13px] tabular-nums focus-visible:outline-2 focus-visible:outline-accent ${
                  selected?.path === e.path
                    ? 'border-accent bg-accent-soft/60 font-medium text-ink'
                    : 'border-transparent text-ink-soft hover:bg-surface-2'
                }`}
              >
                {prettyDate(e.name)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Entry */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        {textError ? (
          <ErrorNotice error={textError} />
        ) : text === null ? (
          <Loading label="leser …" />
        ) : (
          <article className="mx-auto max-w-[72ch] px-10 py-12">
            <Markdown basePath="journal">{text}</Markdown>
          </article>
        )}
      </div>
    </div>
  )
}
