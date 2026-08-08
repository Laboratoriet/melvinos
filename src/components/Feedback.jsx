import { RateLimitError } from '../lib/github'

export function Loading({ label = 'henter …' }) {
  return (
    <div className="flex h-full items-center justify-center p-8 text-sm text-muted">
      <span className="animate-pulse">{label}</span>
    </div>
  )
}

export function ErrorNotice({ error }) {
  const resting = error instanceof RateLimitError
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="font-serif text-lg text-ink-soft">
        {resting ? "Melvin's files are resting." : 'Noe gikk galt i lesingen.'}
      </p>
      <p className="text-sm text-muted">
        {resting ? 'Try again in a few minutes.' : String(error?.message ?? error)}
      </p>
    </div>
  )
}
