import { useEffect, useState } from 'react'
import { ArrowLeft, Folder, BookOpen, Mail, Lamp, Activity, CircleUser, FileText, Image as ImageIcon, Music, Film, AppWindow } from 'lucide-react'
import { useOS, isAwake, msUntilNextWake, formatCountdown } from '../store'
import { listDir, getFileText, rawURL, isMarkdown, isImage, mediaKind } from '../lib/github'
import Markdown from '../components/Markdown'
import MediaView from '../components/MediaView'
import About from '../apps/About'
import { Loading, ErrorNotice } from '../components/Feedback'
import { HONESTY_NOTICE, REPO } from '../config'
import { parseHash, writeHash, looksLikeDir } from '../lib/deeplink'

// Below 768px the desktop metaphor is dishonest — collapse to a clean reader:
// app list → file list → file.

const MOBILE_APPS = [
  { id: 'journal', label: 'Journal', sub: 'dagbok, nyeste først', icon: BookOpen, dir: 'journal', sort: 'desc' },
  { id: 'brev', label: 'Brev', sub: 'til Frank, Natalia, Isak — og seg selv', icon: Mail, dir: 'letters', sort: 'asc' },
  { id: 'files', label: 'Filer', sub: 'hele melvin/', icon: Folder, dir: '', sort: 'asc' },
  { id: 'nattbordet', label: 'Nattbordet', sub: 'gaver fra studioet', icon: Lamp, dir: 'nattbordet', sort: 'asc' },
  { id: 'wake', label: 'Våkelogg', sub: 'alle wakes, nyeste først', icon: Activity, dir: 'wake-log', sort: 'desc' },
  { id: 'about', label: 'Om Melvin', sub: 'hva er dette?', icon: CircleUser },
]

const MEDIA_ICONS = { audio: Music, video: Film, html: AppWindow }

export default function Mobile() {
  // Navigation stack: [{kind:'home'} , {kind:'app',app}, {kind:'dir',path}, {kind:'file',path}]
  const [stack, setStack] = useState(() => {
    const target = parseHash()
    if (target?.kind === 'file')
      return [
        { kind: 'home' },
        looksLikeDir(target.path)
          ? { kind: 'dir', path: target.path }
          : { kind: 'file', path: target.path },
      ]
    const app = target?.kind === 'app' && MOBILE_APPS.find((a) => a.id === target.appId)
    if (app) return [{ kind: 'home' }, { kind: 'app', app }]
    return [{ kind: 'home' }]
  })
  const top = stack[stack.length - 1]
  const push = (frame) => setStack((s) => [...s, frame])
  const pop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  const commits = useOS((s) => s.commits)
  const awake = isAwake(commits)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (top.kind === 'file' || top.kind === 'dir') writeHash(`melvin/${top.path}`)
    else if (top.kind === 'app') writeHash(top.app.id)
    else writeHash(null)
  }, [top])

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur-sm">
        {stack.length > 1 ? (
          <button type="button" onClick={pop} aria-label="Tilbake" className="-ml-1 p-1 text-ink-soft">
            <ArrowLeft size={20} strokeWidth={1.75} />
          </button>
        ) : (
          <span className="font-semibold tracking-tight">MelvinOS</span>
        )}
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-muted">
          {top.kind === 'file' || top.kind === 'dir' ? `melvin/${top.path}` : top.kind === 'app' ? top.app.label : ''}
        </span>
        <span className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
          <span className={`inline-block h-2 w-2 rounded-full ${awake ? 'bg-awake' : 'bg-border-strong'}`} />
          {awake ? 'våken' : 'sover'}
        </span>
      </header>

      {top.kind === 'home' && <Home push={push} awake={awake} />}
      {top.kind === 'app' && top.app.id === 'about' && <About />}
      {top.kind === 'app' && top.app.id !== 'about' && (
        <DirList path={top.app.dir} sort={top.app.sort} push={push} />
      )}
      {top.kind === 'dir' && <DirList path={top.path} sort="asc" push={push} />}
      {top.kind === 'file' && <FileView path={top.path} />}
    </div>
  )
}

function Home({ push, awake }) {
  return (
    <div className="px-4 py-6">
      <p className="mb-6 font-serif text-[15px] leading-relaxed text-ink-soft">
        Melvins skrivebord, lest rett fra repoet hans.{' '}
        {awake ? 'Han er våken akkurat nå.' : `Han sover — våkner om ${formatCountdown(msUntilNextWake())}.`}
      </p>
      <ul className="space-y-2.5">
        {MOBILE_APPS.map((app) => (
          <li key={app.id}>
            <button
              type="button"
              onClick={() => push({ kind: 'app', app })}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-surface p-4 text-left"
            >
              <app.icon size={22} strokeWidth={1.5} className="shrink-0 text-accent" />
              <span>
                <span className="block font-medium">{app.label}</span>
                <span className="block text-[13px] text-muted">{app.sub}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-8 border-t border-border pt-4 text-[11.5px] leading-relaxed text-muted">
        {HONESTY_NOTICE}{' '}
        <a href={REPO.url} className="text-accent underline" target="_blank" rel="noopener noreferrer">
          Se repoet →
        </a>
      </p>
    </div>
  )
}

function DirList({ path, sort, push }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setItems(null)
    setError(null)
    listDir(path)
      .then((list) =>
        setItems(sort === 'desc' ? [...list].sort((a, b) => b.name.localeCompare(a.name)) : list)
      )
      .catch(setError)
  }, [path, sort])

  if (error) return <ErrorNotice error={error} />
  if (!items) return <Loading />

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const Icon =
          item.type === 'dir'
            ? Folder
            : isImage(item.name)
              ? ImageIcon
              : (MEDIA_ICONS[mediaKind(item.name)] ?? FileText)
        return (
          <li key={item.path}>
            <button
              type="button"
              onClick={() =>
                push(item.type === 'dir' ? { kind: 'dir', path: item.path } : { kind: 'file', path: item.path })
              }
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <Icon
                size={18}
                strokeWidth={1.5}
                className={item.type === 'dir' ? 'shrink-0 text-accent' : 'shrink-0 text-muted'}
              />
              <span className="min-w-0 flex-1 truncate text-[15px]">
                {item.name}
                {item.type === 'dir' && '/'}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function FileView({ path }) {
  const [text, setText] = useState(null)
  const [error, setError] = useState(null)
  const image = isImage(path)
  const media = mediaKind(path)

  useEffect(() => {
    if (image || media) return
    getFileText(path).then(setText).catch(setError)
  }, [path, image, media])

  if (media) {
    return (
      <div className="h-[75vh]">
        <MediaView path={path} kind={media} />
      </div>
    )
  }

  if (image) {
    return (
      <div className="p-4">
        <img src={rawURL(path)} alt={path.split('/').pop()} className="w-full rounded-lg border border-border" />
      </div>
    )
  }
  if (error) return <ErrorNotice error={error} />
  if (text === null) return <Loading label="leser …" />

  const basePath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
  return (
    <article className="px-5 py-6">
      {isMarkdown(path) ? (
        <Markdown basePath={basePath}>{text}</Markdown>
      ) : (
        <pre className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed">{text}</pre>
      )}
    </article>
  )
}
