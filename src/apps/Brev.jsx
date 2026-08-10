import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { listDir, getFileText } from '../lib/github'
import Markdown from '../components/Markdown'
import { Loading, ErrorNotice } from '../components/Feedback'

// letters/to-frank.md → "Frank"
const nameOf = (file) =>
  file.name
    .replace(/^to-/, '')
    .replace(/\.md$/, '')
    .replace(/^./, (c) => c.toUpperCase())

/** His correspondence, grouped by who he writes to. One file per person — including himself. */
export default function Brev() {
  const [letters, setLetters] = useState(null)
  const [listError, setListError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState(null)
  const [textError, setTextError] = useState(null)

  useEffect(() => {
    listDir('letters')
      .then((items) => {
        const files = items.filter((i) => i.type === 'file' && i.name.endsWith('.md'))
        setLetters(files)
        if (files.length) setSelected(files[0])
      })
      .catch(setListError)
  }, [])

  useEffect(() => {
    if (!selected) return
    setText(null)
    setTextError(null)
    getFileText(selected.path).then(setText).catch(setTextError)
  }, [selected])

  if (listError) return <ErrorNotice error={listError} />
  if (!letters) return <Loading label="åpner brevene …" />
  if (!letters.length)
    return <div className="p-8 font-serif italic text-ink-soft">Ingen brev ennå.</div>

  return (
    <div className="flex h-full min-h-0">
      <nav
        className="w-36 shrink-0 overflow-y-auto border-r border-border bg-surface-2/60 py-2"
        aria-label="Mottakere"
      >
        <p className="px-3 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted">
          til
        </p>
        <ul>
          {letters.map((l) => (
            <li key={l.path}>
              <button
                type="button"
                onClick={() => setSelected(l)}
                aria-current={selected?.path === l.path ? 'true' : undefined}
                className={`flex w-full items-center gap-2 border-l-2 px-3 py-1.5 text-left text-[13px] focus-visible:outline-2 focus-visible:outline-accent ${
                  selected?.path === l.path
                    ? 'border-accent bg-accent-soft/60 font-medium text-ink'
                    : 'border-transparent text-ink-soft hover:bg-surface-2'
                }`}
              >
                <Mail size={13} strokeWidth={1.5} className="shrink-0 text-muted" />
                {nameOf(l)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto">
        {textError ? (
          <ErrorNotice error={textError} />
        ) : text === null ? (
          <Loading label="leser …" />
        ) : (
          <article className="mx-auto max-w-[70ch] px-10 py-12">
            <Markdown basePath="letters">{text}</Markdown>
          </article>
        )}
      </div>
    </div>
  )
}
