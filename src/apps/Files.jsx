import { useEffect, useState } from 'react'
import { Folder, FileText, Image, LayoutGrid, List, CornerLeftUp } from 'lucide-react'
import { listDir, isImage } from '../lib/github'
import { useOS } from '../store'
import { Loading, ErrorNotice } from '../components/Feedback'
import { openReader } from './index'

function ItemIcon({ item, size = 16 }) {
  if (item.type === 'dir') return <Folder size={size} strokeWidth={1.5} className="text-accent" />
  if (isImage(item.name)) return <Image size={size} strokeWidth={1.5} className="text-muted" />
  return <FileText size={size} strokeWidth={1.5} className="text-muted" />
}

const fmtSize = (b) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : b >= 1024 ? `${Math.round(b / 1024)} kB` : `${b} B`

export default function Files({ initialDir = '' }) {
  const open = useOS((s) => s.open)
  const [root, setRoot] = useState(null)
  const [rootError, setRootError] = useState(null)
  const [selected, setSelected] = useState(initialDir) // '' = melvin/ root

  useEffect(() => setSelected(initialDir), [initialDir])
  const [items, setItems] = useState(null)
  const [itemsError, setItemsError] = useState(null)
  const [view, setView] = useState('list')

  useEffect(() => {
    listDir('').then(setRoot).catch(setRootError)
  }, [])

  useEffect(() => {
    setItems(null)
    setItemsError(null)
    if (selected === '') {
      listDir('').then(setItems).catch(setItemsError)
    } else {
      listDir(selected).then(setItems).catch(setItemsError)
    }
  }, [selected])

  function activate(item) {
    if (item.type === 'dir') setSelected(item.path)
    else openReader(open, item.path)
  }

  if (rootError) return <ErrorNotice error={rootError} />
  if (!root) return <Loading label="åpner melvin/ …" />

  const dirs = root.filter((i) => i.type === 'dir')
  const looseFiles = root.filter((i) => i.type === 'file')

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar — Melvin's real top level, live from the repo */}
      <aside className="w-48 shrink-0 overflow-y-auto border-r border-border bg-surface-2/60 p-2">
        <p className="px-2 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted">
          melvin/
        </p>
        <ul>
          <li>
            <SidebarRow
              active={selected === ''}
              onClick={() => setSelected('')}
              icon={<Folder size={15} strokeWidth={1.5} className="text-accent" />}
              label="alt"
            />
          </li>
          {dirs.map((d) => (
            <li key={d.path}>
              <SidebarRow
                active={selected === d.path}
                onClick={() => setSelected(d.path)}
                icon={<Folder size={15} strokeWidth={1.5} className="text-accent" />}
                label={d.name}
              />
            </li>
          ))}
        </ul>
        <p className="px-2 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted">
          løse filer
        </p>
        <ul>
          {looseFiles.map((f) => (
            <li key={f.path}>
              <SidebarRow
                onClick={() => openReader(open, f.path)}
                icon={<ItemIcon item={f} size={15} />}
                label={f.name}
              />
            </li>
          ))}
        </ul>
      </aside>

      {/* Main pane */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
          <span className="flex min-w-0 items-center gap-1.5">
            {selected && (
              <button
                type="button"
                onClick={() => setSelected(selected.includes('/') ? selected.slice(0, selected.lastIndexOf('/')) : '')}
                aria-label="Opp ett nivå"
                className="rounded-md p-1 text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
              >
                <CornerLeftUp size={13} strokeWidth={1.75} />
              </button>
            )}
            <span className="truncate font-mono text-[11.5px] text-muted">
              melvin/{selected ? `${selected}/` : ''}
            </span>
          </span>
          <div className="flex gap-0.5">
            <ViewToggle active={view === 'list'} onClick={() => setView('list')} label="Listevisning">
              <List size={15} />
            </ViewToggle>
            <ViewToggle active={view === 'grid'} onClick={() => setView('grid')} label="Rutenett">
              <LayoutGrid size={15} />
            </ViewToggle>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {itemsError ? (
            <ErrorNotice error={itemsError} />
          ) : !items ? (
            <Loading />
          ) : view === 'list' ? (
            <table className="w-full text-sm">
              <tbody>
                {items.map((item) => (
                  <tr key={item.path} className="group">
                    <td className="w-8 pl-3">
                      <ItemIcon item={item} />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => activate(item)}
                        className="block w-full truncate py-1.5 pr-2 text-left group-hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        {item.name}
                        {item.type === 'dir' && '/'}
                      </button>
                    </td>
                    <td className="w-20 pr-4 text-right font-mono text-[11px] text-muted">
                      {item.type === 'file' ? fmtSize(item.size) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1 p-3">
              {items.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => activate(item)}
                  className="flex flex-col items-center gap-1.5 rounded-lg p-3 text-center hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <ItemIcon item={item} size={28} />
                  <span className="w-full break-words text-xs leading-tight">
                    {item.name}
                    {item.type === 'dir' && '/'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SidebarRow({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 truncate rounded-md px-2 py-1 text-[13px] focus-visible:outline-2 focus-visible:outline-accent ${
        active ? 'bg-accent-soft text-ink' : 'text-ink-soft hover:bg-surface-2'
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}

function ViewToggle({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded-md p-1.5 focus-visible:outline-2 focus-visible:outline-accent ${
        active ? 'bg-accent-soft text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
