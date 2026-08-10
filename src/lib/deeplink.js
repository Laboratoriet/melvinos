// Hash deep links: #melvin/journal/2026-08-08.md opens that file,
// #terminal opens an app. replaceState only — no history spam.

const APP_IDS = ['files', 'journal', 'brev', 'nattbordet', 'wake', 'about', 'terminal', 'trash']

// The Journal manages its own hash (per-entry); the store reads the latest here.
export let journalHash = 'journal'
export function setJournalHash(path) {
  journalHash = path ? `melvin/${path}` : 'journal'
}

export function parseHash(raw = window.location.hash) {
  const s = decodeURIComponent(raw.replace(/^#\/?/, '')).replace(/\/$/, '')
  if (!s) return null
  const path = s.startsWith('melvin/') ? s.slice('melvin/'.length) : s
  if (APP_IDS.includes(path)) return { kind: 'app', appId: path }
  if (path.includes('/') || path.includes('.')) return { kind: 'file', path }
  return null
}

export function writeHash(value) {
  const url = value
    ? `${window.location.pathname}${window.location.search}#${value}`
    : `${window.location.pathname}${window.location.search}`
  window.history.replaceState(null, '', url)
}

/** Hash value for a window opened via the store. */
export function hashForWindow(win) {
  if (!win) return null
  if (win.appId === 'reader') return `melvin/${win.props.path}`
  if (win.appId === 'journal') return journalHash
  return win.appId
}
