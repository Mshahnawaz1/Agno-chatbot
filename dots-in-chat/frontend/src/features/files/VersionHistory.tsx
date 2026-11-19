import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, History, RotateCcw, User } from 'lucide-react'
import clsx from 'clsx'
import * as api from '@/lib/api'
import { Button, IconButton, Spinner } from '@/components/ui'
import { useFilePanelContext } from './useFilePanel'

const ACTION: Record<api.FileVersion['action'], string> = {
  created: 'Created',
  updated: 'Edited',
  deleted: 'Deleted',
  restored: 'Restored',
}

function ago(iso: string): string {
  // SQLite's CURRENT_TIMESTAMP is UTC without a zone marker.
  const s = Math.max(0, (Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return `${Math.floor(s / 86400)} d ago`
}

function size(n: number): string {
  return n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`
}

/** A History button for a file: lists every version (who, what, when) and restores one. */
export function VersionHistory({ path }: { path: string }) {
  const [open, setOpen] = useState(false)
  const { touch } = useFilePanelContext()
  const queryClient = useQueryClient()
  const key = ['file-versions', path]
  const versions = useQuery({ queryKey: key, queryFn: () => api.listFileVersions(path), enabled: open, staleTime: 0 })
  const restore = useMutation({
    mutationFn: (v: number) => api.restoreFileVersion(path, v),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key })
      void queryClient.invalidateQueries({ queryKey: ['files'] })
      touch(path, true) // reload the preview with the restored content
    },
  })
  const rows = versions.data ?? []

  return (
    <div className="relative">
      <IconButton aria-label="Version history" aria-expanded={open} size="sm" onClick={() => setOpen((o) => !o)}>
        <History className="size-4" aria-hidden />
      </IconButton>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border-strong bg-surface shadow-xl">
          <p className="border-b border-border px-3 py-2 text-xs font-semibold text-fg-muted">Version history</p>
          <ul className="max-h-80 overflow-y-auto">
            {versions.isPending ? (
              <li className="flex items-center gap-2 px-3 py-3 text-sm text-fg-muted"><Spinner label="Loading" /> Loading…</li>
            ) : versions.isError ? (
              <li className="px-3 py-3 text-sm text-danger">Could not load the history.</li>
            ) : rows.length === 0 ? (
              <li className="px-3 py-3 text-sm text-fg-muted">No versions yet.</li>
            ) : (
              rows.map((v, i) => {
                const Who = v.author === 'agent' ? Bot : User
                const current = i === 0
                return (
                  <li key={v.version} className="flex items-center gap-2.5 border-b border-border px-3 py-2 last:border-b-0">
                    <Who className={clsx('size-4 shrink-0', v.author === 'agent' ? 'text-accent-2' : 'text-fg-subtle')} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-fg">
                        v{v.version} · {ACTION[v.action]} by {v.author === 'agent' ? 'the agent' : 'you'}
                      </span>
                      <span className="block text-xs text-fg-subtle">
                        {ago(v.created_at)}{v.action !== 'deleted' ? ` · ${size(v.size)}` : ''}
                      </span>
                    </span>
                    {current ? (
                      <span className="shrink-0 text-xs text-success">{v.action === 'deleted' ? '' : 'Current'}</span>
                    ) : v.action === 'deleted' ? null : (
                      <Button size="sm" variant="secondary" loading={restore.isPending && restore.variables === v.version} onClick={() => restore.mutate(v.version)}>
                        <RotateCcw className="size-3.5" aria-hidden /> Restore
                      </Button>
                    )}
                  </li>
                )
              })
            )}
          </ul>
          {restore.isError ? <p role="alert" className="border-t border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">Could not restore that version.</p> : null}
        </div>
      ) : null}
    </div>
  )
}
