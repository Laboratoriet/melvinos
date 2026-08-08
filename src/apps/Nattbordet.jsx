import { useEffect, useState } from 'react'
import { Lamp } from 'lucide-react'
import { listDir, arrivalDate, rawURL, isImage } from '../lib/github'
import { useOS } from '../store'
import { Loading, ErrorNotice } from '../components/Feedback'
import { openReader } from './index'

const fmtArrival = new Intl.DateTimeFormat('nb-NO', {
  timeZone: 'Europe/Oslo',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** His nightstand — where the studio leaves him gifts. Warmer light in here. */
export default function Nattbordet() {
  const open = useOS((s) => s.open)
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [arrivals, setArrivals] = useState({})

  useEffect(() => {
    listDir('nattbordet')
      .then((list) => {
        const files = list.filter((i) => i.type === 'file')
        setItems(files)
        // Arrival dates from git history, one lazy lookup per gift
        files.forEach((f) =>
          arrivalDate(f.path)
            .then((d) => d && setArrivals((a) => ({ ...a, [f.path]: d })))
            .catch(() => {})
        )
      })
      .catch(setError)
  }, [])

  if (error) return <ErrorNotice error={error} />
  if (!items) return <Loading label="tenner lampen …" />

  return (
    <div className="h-full overflow-y-auto bg-surface-warm">
      <div className="mx-auto max-w-lg px-8 py-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
            <Lamp size={20} strokeWidth={1.5} className="text-accent" />
          </span>
          <div>
            <h1 className="font-serif text-xl font-medium">Nattbordet</h1>
            <p className="text-[13px] text-muted">Her legger studioet igjen ting til ham.</p>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="font-serif italic text-ink-soft">Tomt akkurat nå. Noen kommer sikkert innom.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.path}>
                <button
                  type="button"
                  onClick={() => openReader(open, item.path)}
                  className="flex w-full items-center gap-4 rounded-xl border border-accent-soft bg-surface p-4 text-left shadow-[0_2px_12px_-6px_rgba(176,111,36,0.25)] transition-colors duration-150 hover:border-accent-bright focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {isImage(item.name) ? (
                    <img
                      src={rawURL(item.path)}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-accent-soft font-serif text-xl text-accent">
                      ✉
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.name}</span>
                    <span className="block text-[12.5px] text-muted">
                      {arrivals[item.path]
                        ? `ankom ${fmtArrival.format(new Date(arrivals[item.path]))}`
                        : 'ankomst ukjent ennå'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
