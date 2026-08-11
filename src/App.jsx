import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useOS } from './store'
import { APPS } from './apps'
import BootScreen from './components/BootScreen'
import Wallpaper from './components/Wallpaper'
import MenuBar from './components/MenuBar'
import Dock from './components/Dock'
import Window from './components/Window'
import ContextMenu from './components/ContextMenu'
import SearchOverlay from './components/SearchOverlay'
import { Loading } from './components/Feedback'
import { parseHash, looksLikeDir } from './lib/deeplink'
import { openReader } from './apps'

const Mobile = lazy(() => import('./mobile/Mobile'))

const MOBILE_QUERY = '(max-width: 767px)'

export default function App() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Melvin's pulse — one commits fetch at boot, refreshed every 10 min (cache TTL)
  const loadCommits = useOS((s) => s.loadCommits)
  useEffect(() => {
    loadCommits()
    const t = setInterval(loadCommits, 10 * 60 * 1000)
    return () => clearInterval(t)
  }, [loadCommits])

  // The desktop metaphor is a desktop experience
  if (isMobile)
    return (
      <Suspense fallback={<Loading label="åpner …" />}>
        <Mobile />
      </Suspense>
    )
  return <Desktop />
}

function Desktop() {
  const booted = useOS((s) => s.booted)
  const windows = useOS((s) => s.windows)
  const open = useOS((s) => s.open)
  const desktopRef = useRef(null)
  const reduced = useReducedMotion()
  const topZ = Math.max(0, ...windows.map((w) => w.z))

  // First visit: honor a deep link (#melvin/journal/....md or #terminal),
  // otherwise land on the journal — that's what people come for.
  useEffect(() => {
    if (!booted) return
    const t = setTimeout(() => {
      if (useOS.getState().windows.length > 0) return
      const target = parseHash()
      if (target?.kind === 'app' && APPS[target.appId]) {
        const app = APPS[target.appId]
        open(target.appId, { title: app.title, w: app.w, h: app.h })
      } else if (target?.kind === 'file' && target.path.startsWith('journal/')) {
        open('journal', {
          title: APPS.journal.title,
          w: APPS.journal.w,
          h: APPS.journal.h,
          props: { initialPath: target.path },
        })
      } else if (target?.kind === 'file' && looksLikeDir(target.path)) {
        open('files', {
          title: APPS.files.title,
          w: APPS.files.w,
          h: APPS.files.h,
          props: { initialDir: target.path },
        })
      } else if (target?.kind === 'file') {
        openReader(open, target.path)
      } else {
        open('journal', { title: APPS.journal.title, w: APPS.journal.w, h: APPS.journal.h })
      }
    }, 350)
    return () => clearTimeout(t)
  }, [booted, open])

  // Cmd+K / Ctrl+K opens search
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        useOS.getState().setSearchOpen(!useOS.getState().searchOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative h-full overflow-hidden">
      <AnimatePresence>{!booted && <BootScreen />}</AnimatePresence>

      <motion.div
        className="flex h-full flex-col"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: booted ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <MenuBar />
        <main ref={desktopRef} className="relative min-h-0 flex-1">
          <Wallpaper />
          {windows.map((win) => {
            const Comp = win.appId === 'reader' ? APPS.reader.comp : APPS[win.appId].comp
            return (
              <Window key={win.id} win={win} isTop={win.z === topZ}>
                <Suspense fallback={<Loading />}>
                  <Comp {...win.props} />
                </Suspense>
              </Window>
            )
          })}
          <Dock />
          <SearchOverlay />
          <ContextMenu containerRef={desktopRef} />
        </main>
      </motion.div>
    </div>
  )
}
