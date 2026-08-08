import { useEffect, useRef } from 'react'
import { Rnd } from 'react-rnd'
import { X } from 'lucide-react'
import { useOS } from '../store'

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function Window({ win, isTop, children }) {
  const { close, focus, moveResize } = useOS.getState()
  const bodyRef = useRef(null)

  // Focus the window when it becomes topmost
  useEffect(() => {
    if (isTop && bodyRef.current && !bodyRef.current.contains(document.activeElement)) {
      bodyRef.current.focus({ preventScroll: true })
    }
  }, [isTop, win.id])

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      close(win.id)
      return
    }
    // Focus trap while the window is active
    if (e.key !== 'Tab') return
    const nodes = bodyRef.current?.closest('.melvin-window')?.querySelectorAll(FOCUSABLE)
    if (!nodes?.length) return
    const list = Array.from(nodes)
    const first = list[0]
    const last = list[list.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <Rnd
      className="melvin-window pointer-events-auto"
      style={{ zIndex: win.z }}
      size={{ width: win.w, height: win.h }}
      position={{ x: win.x, y: win.y }}
      minWidth={340}
      minHeight={240}
      bounds="parent"
      dragHandleClassName="melvin-titlebar"
      onDragStart={() => focus(win.id)}
      onDragStop={(_, d) => moveResize(win.id, { x: d.x, y: d.y })}
      onResizeStop={(_, __, ref, ___, pos) =>
        moveResize(win.id, { w: ref.offsetWidth, h: ref.offsetHeight, x: pos.x, y: pos.y })
      }
    >
      <section
        role="dialog"
        aria-label={win.title}
        onMouseDown={() => focus(win.id)}
        onKeyDown={onKeyDown}
        className={`flex h-full w-full flex-col overflow-hidden rounded-xl border bg-surface ${
          isTop
            ? 'border-border-strong shadow-[0_18px_50px_-18px_rgba(43,40,34,0.4)]'
            : 'border-border shadow-[0_10px_30px_-16px_rgba(43,40,34,0.25)]'
        }`}
      >
        <header
          className={`melvin-titlebar flex h-9 shrink-0 cursor-grab items-center border-b border-border pl-4 pr-2 active:cursor-grabbing ${
            isTop ? 'bg-surface-2' : 'bg-surface'
          }`}
        >
          <span
            className={`min-w-0 flex-1 truncate font-mono text-[11.5px] ${
              isTop ? 'text-ink-soft' : 'text-muted'
            }`}
          >
            {win.title}
          </span>
          <button
            type="button"
            onClick={() => close(win.id)}
            aria-label={`Lukk ${win.title}`}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-accent-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </header>
        <div ref={bodyRef} tabIndex={-1} className="min-h-0 flex-1 outline-none">
          {children}
        </div>
      </section>
    </Rnd>
  )
}
