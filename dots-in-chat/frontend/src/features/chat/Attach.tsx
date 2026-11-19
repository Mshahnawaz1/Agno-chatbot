import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DropdownMenu } from 'radix-ui'
import { Check, FolderOpen, Paperclip, Upload, X } from 'lucide-react'
import clsx from 'clsx'
import * as api from '@/lib/api'
import { Dialog, DialogContent, Spinner } from '@/components/ui'
import { Tooltip } from '@/components/ui'
import { KIND_ICON } from '@/features/files/kinds'
import { fileName } from '@/features/files/fileRefs'
import { useFilePanelContext } from '@/features/files/useFilePanel'
import { kindOf } from '@/features/files/fileRefs'
import { MAX_ATTACHMENTS, type Attached } from './attachments'

export const ACCEPT = '.pdf,.docx,.md,.html,.xlsx,.pptx'

const itemClass =
  'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-3'

/** A file the message carries. Removable in the composer; in a sent message it opens the preview. */
export function AttachmentChip({ file, onRemove }: { file: { path: string; kind?: Attached['kind'] }; onRemove?: () => void }) {
  const { open } = useFilePanelContext()
  const Icon = KIND_ICON[file.kind ?? kindOf(file.path) ?? 'md']
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-lg border border-border bg-surface-2 text-sm text-fg">
      <button
        type="button"
        onClick={() => open(file.path)}
        title={file.path}
        className="flex min-w-0 items-center gap-2 rounded-lg py-1.5 pl-2.5 pr-2 transition-colors hover:bg-surface-3"
      >
        <Icon className="size-4 shrink-0 text-accent" aria-hidden />
        <span className="truncate">{fileName(file.path)}</span>
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${fileName(file.path)}`}
          className="mr-1 grid size-6 shrink-0 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </span>
  )
}

function ArtifactPicker({
  open, onOpenChange, attached, onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  attached: Attached[]
  onPick: (file: Attached) => void
}) {
  const files = useQuery({ queryKey: ['files'], queryFn: api.listFiles, enabled: open })
  const chosen = new Set(attached.map((a) => a.path))
  const list = [...(files.data ?? [])].sort((a, b) => b.modified.localeCompare(a.modified))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Choose from artifacts" description="Files you uploaded or the agent made." className="max-w-md">
        {files.isPending ? (
          <div className="flex justify-center py-10">
            <Spinner label="Loading artifacts" />
          </div>
        ) : files.isError ? (
          <p role="alert" className="py-8 text-center text-sm text-danger">Could not load your artifacts.</p>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-muted">No artifacts yet. Upload a file or ask the agent to create one.</p>
        ) : (
          <ul className="-mx-2 flex max-h-80 flex-col gap-0.5 overflow-y-auto">
            {list.map((f) => {
              const Icon = KIND_ICON[f.kind]
              const on = chosen.has(f.path)
              return (
                <li key={f.path}>
                  <button
                    type="button"
                    disabled={!on && chosen.size >= MAX_ATTACHMENTS}
                    onClick={() => onPick(f)}
                    aria-pressed={on}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-surface-3 disabled:opacity-50',
                      on && 'bg-surface-2',
                    )}
                  >
                    <Icon className="size-5 shrink-0 text-accent" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-fg">{f.name}</span>
                      <span className="block text-xs text-fg-subtle">{f.origin === 'uploaded' ? 'Uploaded' : 'Generated'}</span>
                    </span>
                    {on ? <Check className="size-4 shrink-0 text-success" aria-hidden /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** The paperclip: upload from the device, or reference a file already in Artifacts. */
export function AttachButton({
  attached, uploading, onUpload, onPick,
}: {
  attached: Attached[]
  uploading: boolean
  onUpload: (files: File[]) => void
  onPick: (file: Attached) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload files"
        onChange={(e) => {
          onUpload(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
      <DropdownMenu.Root>
        <Tooltip content="Attach files">
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Attach files"
              disabled={uploading}
              className="grid size-9 shrink-0 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg disabled:opacity-60"
            >
              {uploading ? <Spinner label="Uploading" /> : <Paperclip className="size-5" aria-hidden />}
            </button>
          </DropdownMenu.Trigger>
        </Tooltip>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="top"
            align="start"
            sideOffset={8}
            className="z-50 min-w-56 rounded-lg border border-border bg-surface p-1 shadow-2xl"
          >
            <DropdownMenu.Item className={itemClass} onSelect={() => input.current?.click()}>
              <Upload className="size-4 text-fg-muted" aria-hidden />
              Upload from device
            </DropdownMenu.Item>
            <DropdownMenu.Item className={itemClass} onSelect={() => setPickerOpen(true)}>
              <FolderOpen className="size-4 text-fg-muted" aria-hidden />
              Choose from artifacts
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <ArtifactPicker open={pickerOpen} onOpenChange={setPickerOpen} attached={attached} onPick={onPick} />
    </>
  )
}
