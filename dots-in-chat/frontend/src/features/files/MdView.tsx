import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CircleAlert, Pencil, Sparkles, Undo2 } from 'lucide-react'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui'
import { AiEditBar, type AiEdit } from './AiEditBar'
import { linedComponents, replaceLines, selectionLines, TargetContext, type LineRange } from './mdLines'
import { useFilePanelContext } from './useFilePanel'

type Candidate = { x: number; y: number; text: string; lines: LineRange; range: Range }

/** The browser can draw a highlight over a Range without touching the DOM (CSS Custom Highlight API). */
type HighlightRegistry = { set(name: string, h: unknown): void; delete(name: string): void }
const highlights = (): HighlightRegistry | null =>
  typeof CSS !== 'undefined' && 'highlights' in CSS ? (CSS as unknown as { highlights: HighlightRegistry }).highlights : null
const makeHighlight = (range: Range): unknown =>
  new (window as unknown as { Highlight: new (r: Range) => unknown }).Highlight(range)

function message(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

/**
 * A Markdown file: rendered, editable as text, and editable by asking the AI about a selection.
 * Select text and the blocks it touches are highlighted and stay highlighted while you describe the
 * change. The AI's answer is shown first; nothing is written until you apply it (and Undo reverts it).
 */
export function MdView({ path, source, version }: { path: string; source: string; version: string }) {
  const { touch } = useFilePanelContext()
  // Right after a save the new text shows at once; the refetched preview (new version) takes over.
  const [local, setLocal] = useState<{ source: string; version: string; base: string } | null>(null)
  const cur = local && local.base === version ? local : { source, version }

  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [draft, setDraft] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [undo, setUndo] = useState<string | null>(null)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [ai, setAi] = useState<AiEdit | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const abort = useRef<AbortController | null>(null)
  const aiActive = ai !== null

  // A selection in the rendered text offers "Ask AI". Not while an AI edit is already under way.
  useEffect(() => {
    if (mode !== 'view' || aiActive) return
    function onSelectionChange() {
      const sel = document.getSelection()
      const el = root.current
      if (!sel || !el || sel.rangeCount === 0 || sel.isCollapsed) return setCandidate(null)
      const range = sel.getRangeAt(0)
      const text = range.toString().trim()
      const lines = text && el.contains(range.commonAncestorContainer) ? selectionLines(range, el) : null
      if (!lines) return setCandidate(null)
      const r = range.getBoundingClientRect()
      setCandidate({ x: r.left + r.width / 2, y: r.top, text, lines, range: range.cloneRange() })
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [mode, aiActive])

  // The selected text keeps its highlight after the click into the instruction box clears the selection.
  const selRange = ai?.sel.range
  useEffect(() => {
    const registry = highlights()
    if (!registry || !selRange) return
    registry.set('ai-target', makeHighlight(selRange))
    return () => registry.delete('ai-target')
  }, [selRange])

  useEffect(() => () => abort.current?.abort(), [])

  const target = ai?.sel.lines ?? null
  const rendered = useMemo(
    () => (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={linedComponents}>
        {cur.source}
      </ReactMarkdown>
    ),
    [cur.source],
  )

  async function save(content: string): Promise<boolean> {
    setSaving(true)
    setSaveError(null)
    try {
      const { version: v } = await api.saveFileContent(path, content, cur.version)
      setLocal({ source: content, version: v, base: version })
      touch(path, false) // refetch the preview
      return true
    } catch (err) {
      setSaveError(
        err instanceof ApiError && err.status === 409 ? err.message : message(err, 'Could not save the file'),
      )
      return false
    } finally {
      setSaving(false)
    }
  }

  function startEdit() {
    setDraft(cur.source)
    setMode('edit')
    setCandidate(null)
    setSaveError(null)
    setConfirmDiscard(false)
    setUndo(null)
    cancelAi()
  }

  function leaveEdit() {
    setMode('view')
    setSaveError(null)
    setConfirmDiscard(false)
  }

  function startAi(c: Candidate) {
    setAi({ sel: { text: c.text, lines: c.lines, range: c.range }, phase: 'compose', instruction: '' })
    setCandidate(null)
    setUndo(null)
  }

  function cancelAi() {
    abort.current?.abort()
    setAi(null)
  }

  async function ask(instruction: string) {
    if (!ai) return
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    setAi({ ...ai, phase: 'loading', instruction, error: undefined })
    try {
      const r = await api.aiEditFile(
        {
          path,
          start_line: ai.sel.lines.start,
          end_line: ai.sel.lines.end,
          selected_text: ai.sel.text,
          instruction,
          base_version: cur.version,
        },
        ctrl.signal,
      )
      setAi((a) => (a && !ctrl.signal.aborted ? { ...a, phase: 'review', replacement: r.replacement } : a))
    } catch (err) {
      if (ctrl.signal.aborted) return
      setAi((a) => (a ? { ...a, phase: 'error', error: message(err, 'The AI could not edit this part.') } : a))
    }
  }

  async function apply() {
    if (!ai || ai.replacement === undefined) return
    const before = cur.source
    if (await save(replaceLines(before, ai.sel.lines, ai.replacement))) {
      setUndo(before)
      setAi(null)
    }
  }

  async function undoApply() {
    if (undo !== null && (await save(undo))) setUndo(null)
  }

  const dirty = mode === 'edit' && draft !== cur.source

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 px-3">
        {mode === 'view' ? (
          <>
            <p className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs text-fg-subtle">
              <Sparkles className="size-3.5 shrink-0" aria-hidden />
              Select text to ask the AI to edit it
            </p>
            <Button size="sm" variant="secondary" onClick={startEdit} disabled={ai?.phase === 'loading'}>
              <Pencil className="size-4" aria-hidden />
              Edit
            </Button>
          </>
        ) : (
          <>
            <p className="min-w-0 flex-1 truncate text-xs text-fg-subtle">Editing Markdown{dirty ? ' · unsaved changes' : ''}</p>
            {confirmDiscard ? (
              <>
                <span className="text-xs text-fg-muted">Discard changes?</span>
                <Button size="sm" variant="secondary" onClick={leaveEdit}>
                  Discard
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirmDiscard(false)}>
                  Keep editing
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="secondary" onClick={() => (dirty ? setConfirmDiscard(true) : leaveEdit())}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={saving}
                  disabled={!dirty}
                  onClick={() => void save(draft).then((ok) => ok && leaveEdit())}
                >
                  Save
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {saveError ? (
        <p role="alert" className="flex items-center gap-2 border-b border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden />
          {saveError}
        </p>
      ) : null}

      {mode === 'edit' ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
              e.preventDefault()
              if (dirty && !saving) void save(draft).then((ok) => ok && leaveEdit())
            }
          }}
          spellCheck
          aria-label="Markdown source"
          className="min-h-0 flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-6 text-fg focus:outline-none"
        />
      ) : (
        <div ref={root} className="md-doc min-h-0 flex-1 overflow-y-auto px-6 py-5 text-[15px]">
          <TargetContext.Provider value={target}>
            <div className="mx-auto max-w-[72ch] min-w-0 break-words text-fg">{rendered}</div>
          </TargetContext.Provider>
        </div>
      )}

      {undo !== null && !ai ? (
        <div role="status" className="step-in flex shrink-0 items-center gap-2 border-t border-white/10 bg-surface px-3 py-2 text-sm text-fg-muted">
          <span className="flex-1">Change applied.</span>
          <Button size="sm" variant="secondary" onClick={() => void undoApply()} loading={saving}>
            <Undo2 className="size-4" aria-hidden />
            Undo
          </Button>
        </div>
      ) : null}

      {ai ? (
        <AiEditBar
          // A new instruction round starts from what was typed last (try again), not a blank box.
          key={ai.phase === 'compose' ? `compose:${ai.instruction}` : ai.phase}
          ai={ai}
          busy={saving}
          onSubmit={(t) => void ask(t)}
          onCancel={cancelAi}
          onApply={() => void apply()}
          onRetry={() => setAi({ ...ai, phase: 'compose', error: undefined })}
          onDiscard={cancelAi}
        />
      ) : null}

      {candidate ? (
        <button
          type="button"
          // Keep the selection: a mousedown would otherwise collapse it before the click lands.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => startAi(candidate)}
          style={{ left: candidate.x, top: Math.max(8, candidate.y - 40) }}
          className="step-in fixed z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-accent/50 bg-surface px-3 py-1.5 text-xs font-medium text-fg shadow-xl transition-colors hover:bg-surface-3"
        >
          <Sparkles className="size-3.5 text-accent" aria-hidden />
          Ask AI to edit
        </button>
      ) : null}
    </div>
  )
}
