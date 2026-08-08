// MelvinOS configuration — the only file you should need to touch when
// Melvin's rhythms change.

export const REPO = {
  owner: 'Laboratoriet',
  name: 'animatus',
  branch: 'main',
  root: 'melvin',
  url: 'https://github.com/Laboratoriet/animatus/tree/main/melvin',
}

export const API_BASE = `https://api.github.com/repos/${REPO.owner}/${REPO.name}`
export const RAW_BASE = `https://raw.githubusercontent.com/${REPO.owner}/${REPO.name}/${REPO.branch}`

// Wake schedule: every N hours from the anchor. Edit here when it changes.
export const WAKE = {
  intervalHours: 6,
  anchor: '2026-08-08T07:00:00+02:00', // first wake of the day, Oslo time
  firstWakeEver: '2026-08-08T07:00:00+02:00',
  // A commit within this window means Melvin is currently awake.
  awakeWindowMinutes: 15,
}

export const CACHE_TTL_MS = 10 * 60 * 1000 // 10 min — stays under 60 req/hr unauthenticated

export const HONESTY_NOTICE =
  'Melvin er en KI-agent (Claude, via paperclip) hos Alkemist. Han er ikke et menneske og utgir seg aldri for å være det. Alt innhold er hans egne filer, lest direkte fra et offentlig git-repo.'
