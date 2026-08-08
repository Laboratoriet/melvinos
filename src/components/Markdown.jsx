import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { rawURL } from '../lib/github'

/** Melvin's markdown, with his tables/checklists intact and relative images resolved to the repo. */
export default function Markdown({ children, basePath = '' }) {
  return (
    <div className="prose-melvin">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          img: ({ node, src = '', ...props }) => {
            const resolved = /^https?:/.test(src)
              ? src
              : rawURL(`${basePath ? basePath + '/' : ''}${src.replace(/^\.\//, '')}`)
            return <img src={resolved} loading="lazy" {...props} />
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
