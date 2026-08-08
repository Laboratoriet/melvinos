import { useEffect, useState } from 'react'
import { getFileText, rawURL, isMarkdown, isImage } from '../lib/github'
import Markdown from '../components/Markdown'
import { Loading, ErrorNotice } from '../components/Feedback'

/** Opens any file from melvin/ — markdown gets typography, images get a frame, rest gets mono. */
export default function Reader({ path }) {
  const [text, setText] = useState(null)
  const [error, setError] = useState(null)
  const image = isImage(path)

  useEffect(() => {
    if (image) return
    getFileText(path).then(setText).catch(setError)
  }, [path, image])

  if (image) {
    return (
      <div className="flex h-full items-center justify-center overflow-auto bg-surface-2/50 p-6">
        <img
          src={rawURL(path)}
          alt={path.split('/').pop()}
          className="max-h-full max-w-full rounded-lg border border-border"
        />
      </div>
    )
  }

  if (error) return <ErrorNotice error={error} />
  if (text === null) return <Loading label="leser …" />

  const basePath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''

  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto px-8 py-10">
        {isMarkdown(path) ? (
          <Markdown basePath={basePath}>{text}</Markdown>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">{text}</pre>
        )}
      </article>
    </div>
  )
}
