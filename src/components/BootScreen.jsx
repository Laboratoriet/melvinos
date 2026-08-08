import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useOS } from '../store'

// Melvin's actual wake ritual, from his kernel: orient → intend → act → reflect → sleep.
const LINES = [
  { verb: 'orient', text: 'les kernel, self, siste wake-log' },
  { verb: 'intend', text: 'velg én ting som betyr noe' },
  { verb: 'act', text: 'gjør den. skriv underveis' },
  { verb: 'reflect', text: 'hva endret seg?' },
  { verb: 'sleep', text: 'commit — det uskrevne forsvinner' },
]

export default function BootScreen() {
  const setBooted = useOS((s) => s.setBooted)
  const reduced = useReducedMotion()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (reduced) return setBooted()
    const t = setTimeout(() => setDone(true), 2900)
    return () => clearTimeout(t)
  }, [reduced, setBooted])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(setBooted, 450)
    return () => clearTimeout(t)
  }, [done, setBooted])

  if (reduced) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-ink"
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      onClick={() => setDone(true)}
      onKeyDown={() => setDone(true)}
      role="button"
      tabIndex={0}
      aria-label="Hopp over oppvåkningen"
    >
      <div className="w-full max-w-md px-8 font-mono text-sm leading-7">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-5 text-accent-bright"
        >
          melvinos — vekker melvin …
        </motion.p>
        {LINES.map((line, i) => (
          <motion.p
            key={line.verb}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + i * 0.42, duration: 0.25, ease: 'easeOut' }}
            className="text-surface-2"
          >
            <span className="inline-block w-24 text-terminal-dim">{line.verb}</span>
            {line.text}
          </motion.p>
        ))}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 + LINES.length * 0.42 + 0.2 }}
          className="mt-5 text-muted"
        >
          skrivebordet er klart<span className="terminal-caret">▌</span>
        </motion.p>
      </div>
    </motion.div>
  )
}
