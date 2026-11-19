import { createContext, useContext, type ReactNode } from 'react'
import type { Components } from 'react-markdown'
import { markdownComponents } from '@/components/markdownComponents'

/** Source lines of a Markdown document, 1-based and inclusive. */
export type LineRange = { start: number; end: number }

/** The lines the AI is about to edit: blocks inside it are drawn highlighted. */
export const TargetContext = createContext<LineRange | null>(null)

type Position = { start: { line: number }; end: { line: number } }
type Lined = { node?: { position?: Position } }

function marks(node: Lined['node'], target: LineRange | null) {
  const pos = node?.position
  if (!pos) return {}
  return {
    'data-lines': `${pos.start.line}-${pos.end.line}`,
    'data-target': target && pos.start.line >= target.start && pos.end.line <= target.end ? 'true' : undefined,
  }
}

/** Wraps a block component so the element it draws carries its source lines. */
function lined<P extends object>(Base: (props: P) => ReactNode) {
  return function LinedBlock({ node, ...props }: P & Lined) {
    const target = useContext(TargetContext)
    return Base({ ...props, ...marks(node, target) } as unknown as P)
  }
}

const LinedPre = lined((props: { children?: ReactNode }) => <div {...props} />)

const base = markdownComponents as Record<string, (props: object) => ReactNode>
const block = <T,>(tag: string) => lined(base[tag]) as unknown as T

/** The app's Markdown look, with each block (paragraph, heading, list item, code, table) tagged
 *  with the source lines it came from. That is how a selection on screen maps back to the file. */
export const linedComponents: Components = {
  ...markdownComponents,
  h1: block<Components['h1']>('h1'), h2: block<Components['h2']>('h2'),
  h3: block<Components['h3']>('h3'), h4: block<Components['h4']>('h4'),
  p: block<Components['p']>('p'), li: block<Components['li']>('li'), table: block<Components['table']>('table'),
  pre: LinedPre as unknown as Components['pre'],
}

/** Source lines covered by the blocks a selection touches (the innermost ones: a paragraph, not
 *  the list that holds it). Blocks the selection only brushes against, at a boundary, don't count. */
export function selectionLines(range: Range, root: HTMLElement): LineRange | null {
  const hits = Array.from(root.querySelectorAll<HTMLElement>('[data-lines]')).filter((el) => {
    const inner = document.createRange()
    inner.selectNodeContents(el)
    // The part of the selection inside this block must hold text (a triple-click ends at the very
    // start of the next block; that block is not selected).
    const part = range.cloneRange()
    if (part.compareBoundaryPoints(Range.START_TO_START, inner) < 0) part.setStart(inner.startContainer, inner.startOffset)
    if (part.compareBoundaryPoints(Range.END_TO_END, inner) > 0) part.setEnd(inner.endContainer, inner.endOffset)
    return !part.collapsed && part.toString().trim() !== ''
  })
  const innermost = hits.filter((el) => !hits.some((o) => o !== el && el.contains(o)))
  if (!innermost.length) return null
  let start = Infinity
  let end = 0
  for (const el of innermost) {
    const [s, e] = (el.dataset.lines ?? '').split('-').map(Number)
    if (Number.isFinite(s) && Number.isFinite(e)) {
      start = Math.min(start, s)
      end = Math.max(end, e)
    }
  }
  return end >= start ? { start, end } : null
}

/** The file with lines [start, end] replaced (same line splitting as the server). */
export function replaceLines(source: string, { start, end }: LineRange, replacement: string): string {
  const lines = source.split('\n')
  return [...lines.slice(0, start - 1), ...replacement.split('\n'), ...lines.slice(end)].join('\n')
}
