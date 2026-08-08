import { Folder, BookOpen, Lamp, CircleUser, SquareTerminal, Trash2 } from 'lucide-react'
import { useOS } from '../store'
import { APPS } from '../apps'

const ICONS = {
  files: Folder,
  journal: BookOpen,
  nattbordet: Lamp,
  about: CircleUser,
  terminal: SquareTerminal,
  trash: Trash2,
}

const ORDER = ['files', 'journal', 'nattbordet', 'about', 'terminal']

function DockButton({ appId }) {
  const open = useOS((s) => s.open)
  const app = APPS[appId]
  const Icon = ICONS[appId]
  return (
    <button
      type="button"
      onClick={() => open(appId, { title: app.title, w: app.w, h: app.h })}
      className="dock-item group relative flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      aria-label={app.label}
    >
      <Icon size={22} strokeWidth={1.5} className="text-ink-soft group-hover:text-accent" />
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-ink-soft opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {app.label}
      </span>
    </button>
  )
}

export default function Dock() {
  return (
    <nav
      className="absolute bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-border bg-surface/80 p-2 shadow-[0_8px_24px_-12px_rgba(43,40,34,0.35)] backdrop-blur-md"
      aria-label="Programmer"
    >
      {ORDER.map((id) => (
        <DockButton key={id} appId={id} />
      ))}
      <span className="mx-1 h-8 w-px bg-border" aria-hidden="true" />
      <DockButton appId="trash" />
    </nav>
  )
}
