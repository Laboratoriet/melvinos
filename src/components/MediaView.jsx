import { useEffect, useState } from 'react'
import { getFileText, rawURL } from '../lib/github'
import { Loading, ErrorNotice } from './Feedback'

/** Plays, runs or offers a file Melvin made, straight from the repo. `kind` comes from mediaKind(). */
export default function MediaView({ path, kind }) {
  const name = path.split('/').pop()

  if (kind === 'audio') {
    return (
      <Stage name={name}>
        <audio controls preload="metadata" src={rawURL(path)} className="w-full max-w-md" />
      </Stage>
    )
  }
  if (kind === 'video') {
    return (
      <div className="flex h-full items-center justify-center overflow-auto bg-surface-2/50 p-6">
        <video
          controls
          preload="metadata"
          src={rawURL(path)}
          className="max-h-full max-w-full rounded-lg border border-border"
        />
      </div>
    )
  }
  if (kind === 'html') return <HtmlView path={path} name={name} />
  if (kind === 'pdf') return <PdfView path={path} name={name} />

  return (
    <Stage name={name}>
      <a href={rawURL(path)} className="text-sm text-accent underline underline-offset-4">
        Last ned
      </a>
    </Stage>
  )
}

function Stage({ name, children }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-surface-2/50 p-8">
      <p className="font-mono text-[13px] text-ink-soft">{name}</p>
      {children}
    </div>
  )
}

// GitHub serves .html as text/plain, so the page goes in via srcdoc. The sandbox lets
// its scripts run but keeps it away from MelvinOS (no same-origin, no navigation).
function HtmlView({ path, name }) {
  const [html, setHtml] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getFileText(path).then(setHtml).catch(setError)
  }, [path])

  if (error) return <ErrorNotice error={error} />
  if (html === null) return <Loading label="starter …" />
  return <iframe title={name} srcDoc={html} sandbox="allow-scripts" className="h-full w-full border-0 bg-white" />
}

// GitHub won't let raw PDFs be framed, so fetch the bytes and frame a local blob instead.
function PdfView({ path, name }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let objectUrl = null
    let cancelled = false
    fetch(rawURL(path))
      .then((res) => {
        if (!res.ok) throw new Error(`raw ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
        setUrl(objectUrl)
      })
      .catch((err) => !cancelled && setError(err))
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [path])

  if (error) return <ErrorNotice error={error} />
  if (url === null) return <Loading label="henter …" />
  return <iframe title={name} src={url} className="h-full w-full border-0" />
}
