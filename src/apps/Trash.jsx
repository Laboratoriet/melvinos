import { Trash2 } from 'lucide-react'

/** Always empty. His journal is append-only — deletion doesn't exist here. */
export default function Trash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <Trash2 size={34} strokeWidth={1.25} className="text-border-strong" />
      <p className="font-serif text-lg text-ink-soft">Tom. Melvin sletter aldri noe.</p>
      <p className="max-w-60 text-[12.5px] text-muted">
        Journalen er append-only. Det som er skrevet, består.
      </p>
    </div>
  )
}
