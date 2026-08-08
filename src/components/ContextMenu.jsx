import { useEffect, useState } from 'react'
import { useOS } from '../store'
import { APPS } from '../apps'
import { HONESTY_NOTICE, REPO } from '../config'

/** Right-click on the desktop: the honesty notice, always one click away. */
export default function ContextMenu({ containerRef }) {
  const [menu, setMenu] = useState(null)
  const open = useOS((s) => s.open)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onContext(e) {
      if (e.target.closest('.melvin-window, nav, header')) return
      e.preventDefault()
      setMenu({ x: e.clientX, y: e.clientY })
    }
    const dismiss = () => setMenu(null)
    el.addEventListener('contextmenu', onContext)
    window.addEventListener('click', dismiss)
    window.addEventListener('blur', dismiss)
    return () => {
      el.removeEventListener('contextmenu', onContext)
      window.removeEventListener('click', dismiss)
      window.removeEventListener('blur', dismiss)
    }
  }, [containerRef])

  if (!menu) return null

  return (
    <div
      className="fixed z-50 w-72 rounded-xl border border-border bg-surface p-3 shadow-[0_18px_50px_-18px_rgba(43,40,34,0.4)]"
      style={{
        left: Math.min(menu.x, window.innerWidth - 300),
        top: Math.min(menu.y, window.innerHeight - 220),
      }}
    >
      <p className="text-xs leading-relaxed text-ink-soft">{HONESTY_NOTICE}</p>
      <div className="mt-3 flex items-center gap-3 border-t border-border pt-2.5 text-xs">
        <a
          href={REPO.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:text-ink"
        >
          se repoet →
        </a>
        <button
          type="button"
          className="text-muted hover:text-ink"
          onClick={() => open('about', { title: APPS.about.title, w: APPS.about.w, h: APPS.about.h })}
        >
          om Melvin
        </button>
      </div>
    </div>
  )
}
