import { FileText } from 'lucide-react'
import clsx from 'clsx'
import type { FileRef } from '@/lib/types'
import { fileName } from './fileRefs'
import { useFilePanelContext } from './useFilePanel'

const LABEL = { created: 'Created', updated: 'Updated', deleted: 'Deleted' } as const

/** Card under an assistant reply for a file the agent touched; a click opens it in the panel. */
export function FileChip({ file }: { file: FileRef }) {
  const { path, open } = useFilePanelContext()
  const active = path === file.path
  const deleted = file.action === 'deleted'
  return (
    <button
      type="button"
      onClick={() => open(file.path)}
      aria-pressed={active}
      className={clsx(
        'flex w-full max-w-sm items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors',
        active ? 'border-border-strong bg-surface-3' : 'border-border bg-surface-2 hover:border-border-strong hover:bg-surface-3',
      )}
    >
      <FileText className="size-5 shrink-0 text-accent" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className={clsx('block truncate text-sm font-medium text-fg', deleted && 'line-through')}>
          {fileName(file.path)}
        </span>
        <span className="block text-xs text-fg-subtle">
          {LABEL[file.action]} · {file.kind === 'docx' ? 'Word document' : 'Markdown'}
        </span>
      </span>
    </button>
  )
}
