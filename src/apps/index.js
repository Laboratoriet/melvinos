import { lazy } from 'react'

// Everything loads lazily behind the wake sequence
const Files = lazy(() => import('./Files'))
const Journal = lazy(() => import('./Journal'))
const Nattbordet = lazy(() => import('./Nattbordet'))
const About = lazy(() => import('./About'))
const Terminal = lazy(() => import('./Terminal'))
const Trash = lazy(() => import('./Trash'))
const Reader = lazy(() => import('./Reader'))

// Window title bars use the real repo path — the file system is the truth.
export const APPS = {
  files: { comp: Files, label: 'Filer', title: 'melvin/', w: 920, h: 590 },
  journal: { comp: Journal, label: 'Journal', title: 'melvin/journal/', w: 880, h: 640 },
  nattbordet: { comp: Nattbordet, label: 'Nattbordet', title: 'melvin/nattbordet/', w: 560, h: 560 },
  about: { comp: About, label: 'Om Melvin', title: 'om melvin', w: 680, h: 660 },
  terminal: { comp: Terminal, label: 'Terminal', title: 'melvinos — terminal (read-only)', w: 680, h: 420 },
  trash: { comp: Trash, label: 'Papirkurv', title: 'papirkurv', w: 400, h: 320 },
  reader: { comp: Reader, label: 'Leser', w: 760, h: 620 },
}

/** Open a file in a Reader window; one window per path. */
export function openReader(open, path) {
  open('reader', {
    key: `reader:${path}`,
    title: `melvin/${path}`,
    props: { path },
    w: APPS.reader.w,
    h: APPS.reader.h,
  })
}
