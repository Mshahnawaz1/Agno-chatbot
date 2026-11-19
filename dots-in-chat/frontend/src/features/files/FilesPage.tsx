import { useMemo, useRef, useState, type DragEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, FolderOpen, Upload } from 'lucide-react'
import clsx from 'clsx'
import * as api from '@/lib/api'
import type { FileEntry } from '@/lib/types'
import { Button, Spinner } from '@/components/ui'
import { KIND_ICON, KIND_LABEL } from './kinds'
import { FileThumb } from './FileThumb'
import { FilePanel } from './FilePanel'
import { FilePanelContext, useFilePanelState } from './useFilePanel'

const ACCEPT = '.pdf,.docx,.md,.html,.xlsx,.csv,.pptx'
type Filter = 'all' | 'uploaded' | 'generated'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'uploaded', label: 'Uploaded' },
  { id: 'generated', label: 'Generated' },
]

function size(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function when(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function FileCard({ file, active, onOpen }: { file: FileEntry; active: boolean; onOpen: () => void }) {
  const Icon = KIND_ICON[file.kind]
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-pressed={active}
        className={clsx(
          'flex w-full flex-col overflow-hidden rounded-2xl border text-left transition-colors',
          active ? 'border-border-strong bg-surface-3' : 'border-border bg-surface hover:border-border-strong hover:bg-surface-2',
        )}
      >
        <span className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Icon className="size-5 shrink-0 text-accent" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{file.name}</span>
        </span>
        <FileThumb file={file} />
        <span className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-fg-subtle">
          <span className="truncate">
            {KIND_LABEL[file.kind]} · {size(file.size)} · {when(file.modified)}
          </span>
          <span
            className={clsx(
              'shrink-0 rounded-full px-2 py-0.5 font-medium',
              file.origin === 'uploaded' ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-fg-muted',
            )}
          >
            {file.origin === 'uploaded' ? 'Uploaded' : 'Generated'}
          </span>
        </span>
      </button>
    </li>
  )
}

function FilesView() {
  const panel = useFilePanelState()
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [dragging, setDragging] = useState(false)
  const files = useQuery({ queryKey: ['files'], queryFn: api.listFiles })

  const upload = useMutation({
    mutationFn: api.uploadFiles,
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['files'] })
      setFilter('all')
      if (saved[0]) panel.open(saved[0].path)
    },
  })

  function pick(list: FileList | File[] | null) {
    const chosen = list ? Array.from(list) : []
    if (chosen.length) upload.mutate(chosen)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files)
  }

  // Newest first, so a fresh upload or a file the agent just made is at the top.
  const visible = useMemo(
    () =>
      (files.data ?? [])
        .filter((f) => filter === 'all' || f.origin === filter)
        .sort((a, b) => b.modified.localeCompare(a.modified)),
    [files.data, filter],
  )

  return (
    <FilePanelContext.Provider value={panel}>
      <div className="flex h-full min-h-0">
        <div
          className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col lg:min-w-[380px]"
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
          onDrop={onDrop}
        >
          <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-4 pb-6">
            <div className="flex flex-wrap items-center gap-3 pb-5 pt-2">
              <div role="tablist" aria-label="Filter files" className="flex gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    role="tab"
                    aria-selected={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={clsx(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      filter === f.id ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:bg-surface hover:text-fg',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <input
                ref={input}
                type="file"
                multiple
                accept={ACCEPT}
                className="sr-only"
                tabIndex={-1}
                aria-label="Upload files"
                onChange={(e) => {
                  pick(e.target.files)
                  e.target.value = '' // picking the same file again must fire onChange
                }}
              />
              <Button size="sm" onClick={() => input.current?.click()} loading={upload.isPending}>
                <Upload className="size-4" aria-hidden />
                Upload
              </Button>
            </div>

            {upload.isError ? (
              <p role="alert" className="mb-3 flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {upload.error.message}
              </p>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto">
              {files.isPending ? (
                <div className="flex justify-center py-16">
                  <Spinner label="Loading files" />
                </div>
              ) : files.isError ? (
                <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center text-sm text-fg-muted">
                  Could not load your files.
                  <Button size="sm" variant="secondary" onClick={() => void files.refetch()}>
                    Try again
                  </Button>
                </div>
              ) : visible.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <FolderOpen className="size-8 text-fg-subtle" aria-hidden />
                  <p className="font-medium text-fg">{filter === 'all' ? 'No files yet' : `No ${filter} files`}</p>
                  <p className="max-w-xs text-sm text-fg-muted">
                    Upload a PDF, Word, Markdown, HTML, Excel or PowerPoint file, or ask the agent to create one.
                  </p>
                </div>
              ) : (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                  {visible.map((f) => (
                    <FileCard key={f.path} file={f} active={panel.path === f.path} onOpen={() => panel.open(f.path)} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {dragging ? (
            <div className="pointer-events-none absolute inset-2 z-10 grid place-items-center rounded-xl border-2 border-dashed border-accent bg-bg/80 text-sm font-medium text-fg">
              Drop files to upload
            </div>
          ) : null}
        </div>
        {panel.path ? <FilePanel path={panel.path} /> : null}
      </div>
    </FilePanelContext.Provider>
  )
}

export function FilesPage() {
  return <FilesView />
}
