import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Sparkles, X } from 'lucide-react'
import { Markdown } from '@/components/Markdown'
import { Button, Spinner } from '@/components/ui'
import type { LineRange } from './mdLines'

export type AiEdit = {
  /** The selection being edited; identity is stable, so the highlight isn't redrawn per phase. */
  sel: { text: string; lines: LineRange; range: Range }
  phase: 'compose' | 'loading' | 'review' | 'error'
  instruction: string
  replacement?: string
  error?: string
}

function lineLabel({ start, end }: LineRange): string {
  return start === end ? `Line ${start}` : `Lines ${start}–${end}`
}

/** Docked under the document while the user tells the AI what to do with the highlighted part. */
export function AiEditBar({
  ai, busy, onSubmit, onCancel, onApply, onRetry, onDiscard,
}: {
  ai: AiEdit
  /** Applying the accepted change (saving the file). */
  busy: boolean
  onSubmit: (instruction: string) => void
  onCancel: () => void
  onApply: () => void
  onRetry: () => void
  onDiscard: () => void
}) {
  const [text, setText] = useState(ai.instruction)
  const input = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ai.phase === 'compose') input.current?.focus()
  }, [ai.phase])

  const ready = text.trim() !== ''
  const header = (
    <div className="flex items-start gap-2">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-fg-muted">
          Edit with AI <span className="text-fg-subtle">· {lineLabel(ai.sel.lines)}</span>
        </p>
        <p className="mt-0.5 line-clamp-2 border-l-2 border-accent/60 pl-2 text-xs italic text-fg-subtle wrap-anywhere">
          {ai.sel.text}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel AI edit"
        className="grid size-6 shrink-0 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )

  return (
    <section aria-label="AI edit" className="step-in flex shrink-0 flex-col gap-3 border-t border-white/10 bg-surface p-3">
      {header}
      {ai.phase === 'compose' ? (
        <form
          className="flex items-end gap-2 rounded-2xl border border-border bg-surface-2 py-1.5 pl-3 pr-1.5 focus-within:border-border-strong"
          onSubmit={(e) => {
            e.preventDefault()
            if (ready) onSubmit(text.trim())
          }}
        >
          <textarea
            ref={input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onCancel()
              else if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                if (ready) onSubmit(text.trim())
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="What should change? e.g. make it shorter"
            aria-label="Instruction for the AI"
            className="max-h-28 min-h-7 flex-1 resize-none bg-transparent py-1 text-sm leading-5 text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          <button
            type="submit"
            disabled={!ready}
            aria-label="Send to AI"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-fg-subtle"
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
        </form>
      ) : null}

      {ai.phase === 'loading' ? (
        <div role="status" className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner label="Rewriting" />
          <span className="shimmer">Rewriting the highlighted part…</span>
          <div className="flex-1" />
          <Button size="sm" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      ) : null}

      {ai.phase === 'review' ? (
        <>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-accent">Suggested change</p>
            <Markdown className="text-sm">{ai.replacement ?? ''}</Markdown>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onApply} loading={busy}>
              Apply
            </Button>
            <Button size="sm" variant="secondary" onClick={onRetry} disabled={busy}>
              Try again
            </Button>
            <Button size="sm" variant="secondary" onClick={onDiscard} disabled={busy}>
              Discard
            </Button>
          </div>
        </>
      ) : null}

      {ai.phase === 'error' ? (
        <div role="alert" className="flex items-center gap-2 text-sm text-danger">
          <span className="min-w-0 flex-1">{ai.error}</span>
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </section>
  )
}
