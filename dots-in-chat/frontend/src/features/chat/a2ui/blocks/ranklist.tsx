/**
 * RankList: a short list the user puts in priority order.
 *
 * Pointer: press a row's handle and drag; the row lifts (accent border) and follows the
 * pointer, and swaps places as it passes its neighbours. Keyboard: focus a handle, Space picks
 * the row up, ArrowUp/ArrowDown move it, Space drops it, Escape puts it back; a live region
 * announces each step. "Use this order" sends `use_order` {items} in the current order;
 * "Reset" restores the order the agent sent.
 */
import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { z } from 'zod'
import { Menu } from 'lucide-react'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Action, Actions, Block, ChangePill, Done } from './kit'
import { useLive, useSend } from './hooks'

const RankListApi = {
  name: 'RankList',
  schema: z.object({
    title: z.string().describe('Card title, e.g. "Your priorities".'),
    items: z.array(z.string()).describe('The things to rank, in the proposed order.'),
    subtitle: z.string().optional().describe('Line under the title. Defaults to "Top of the list gets the best hours."'),
    confirmLabel: z.string().optional().describe('Primary button text. Defaults to "Use this order".'),
  }),
}

/** Moves one entry from `from` to `to`. */
function move<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice()
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}

type Drag = { from: number; pointerY: number; grab: number }

export const RankList = createComponentImplementation(RankListApi, ({ props, context }) => {
  const initial = props.items ?? []
  const live = useLive<string[]>(context, initial)
  const send = useSend(context)
  const items = live.value
  const [done, setDone] = useState(false)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [picked, setPicked] = useState<{ index: number; origin: string[] } | null>(null)
  const [announce, setAnnounce] = useState('')
  const rows = useRef<(HTMLLIElement | null)[]>([])
  const handles = useRef<(HTMLButtonElement | null)[]>([])

  // Stable keys that follow an item as it moves (duplicates get an occurrence suffix).
  const seen: Record<string, number> = {}
  const keys = items.map((t) => `${t}#${(seen[t] = (seen[t] ?? -1) + 1)}`)

  // Keep the lifted row under the pointer even after it swapped places.
  useLayoutEffect(() => {
    if (!drag) return
    const el = rows.current[drag.from]
    if (!el) return
    el.style.transform = ''
    const top = el.getBoundingClientRect().top
    el.style.transform = `translateY(${drag.pointerY - drag.grab - top}px) scale(1.02) rotate(0.4deg)`
  })

  const onMove = (e: PointerEvent) => {
    if (!drag) return
    let { from } = drag
    const y = e.clientY
    const mid = (i: number) => {
      const r = rows.current[i]!.getBoundingClientRect()
      return r.top + r.height / 2
    }
    let next = items
    if (from < items.length - 1 && y > mid(from + 1)) {
      next = move(items, from, from + 1)
      from += 1
    } else if (from > 0 && y < mid(from - 1)) {
      next = move(items, from, from - 1)
      from -= 1
    }
    if (next !== items) live.set(next)
    setDrag({ ...drag, from, pointerY: y })
  }

  const endDrag = () => {
    if (!drag) return
    const el = rows.current[drag.from]
    if (el) el.style.transform = ''
    setDrag(null)
  }

  const key = (e: KeyboardEvent, i: number) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (picked) {
        setAnnounce(`Dropped ${items[i]} at position ${i + 1} of ${items.length}.`)
        setPicked(null)
      } else {
        setPicked({ index: i, origin: items })
        setAnnounce(`Picked up ${items[i]}, position ${i + 1} of ${items.length}. Use the arrow keys to move, Space to drop, Escape to cancel.`)
      }
    } else if (picked && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      const to = i + (e.key === 'ArrowUp' ? -1 : 1)
      if (to < 0 || to >= items.length) return
      live.set(move(items, i, to))
      setPicked({ ...picked, index: to })
      setAnnounce(`${items[i]} moved to position ${to + 1} of ${items.length}.`)
      // The row re-renders under a stable key; keep focus on its handle.
      requestAnimationFrame(() => handles.current[to]?.focus())
    } else if (picked && e.key === 'Escape') {
      e.preventDefault()
      live.set(picked.origin)
      setAnnounce(`Cancelled. ${items[i]} is back at position ${picked.origin.indexOf(items[i]) + 1}.`)
      const back = picked.origin.indexOf(items[i])
      setPicked(null)
      requestAnimationFrame(() => handles.current[back]?.focus())
    }
  }

  return (
    <Block
      title={props.title}
      subtitle={props.subtitle ?? 'Top of the list gets the best hours.'}
      pill={<ChangePill changed={live.changed} user="reordered" />}
    >
      <ol className="flex flex-col gap-2.5" onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        {items.map((text, i) => {
          const lifted = drag?.from === i || picked?.index === i
          return (
            <li
              key={keys[i]}
              ref={(el) => {
                rows.current[i] = el
              }}
              data-lifted={lifted || undefined}
              className={
                'blk-inset relative flex items-center gap-3 px-3 py-3 text-sm text-[var(--blk-text)] transition-[border-color,background-color] ' +
                (lifted
                  ? 'z-10 !border-[var(--blk-accent-hi)] !bg-[rgb(91_108_240/0.22)] shadow-lg'
                  : '')
              }
            >
              <button
                type="button"
                ref={(el) => {
                  handles.current[i] = el
                }}
                disabled={done}
                aria-label={`Reorder ${text}, position ${i + 1} of ${items.length}. Space to pick up.`}
                aria-pressed={picked?.index === i}
                className="touch-none cursor-grab text-[var(--blk-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blk-accent-hi)] active:cursor-grabbing disabled:cursor-default disabled:opacity-40"
                onPointerDown={(e) => {
                  if (e.button !== 0) return
                  const rect = rows.current[i]!.getBoundingClientRect()
                  setDrag({ from: i, pointerY: e.clientY, grab: e.clientY - rect.top })
                  ;(e.currentTarget.closest('ol') as HTMLElement).setPointerCapture(e.pointerId)
                }}
                onKeyDown={(e) => key(e, i)}
                onBlur={() => picked && picked.index === i && setPicked(null)}
              >
                <Menu className="size-4" aria-hidden />
              </button>
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--blk-accent)] text-xs font-medium text-white">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">{text}</span>
            </li>
          )
        })}
      </ol>
      <div aria-live="assertive" className="sr-only">
        {announce}
      </div>

      {done ? (
        <Done>✓ Order saved · {items.length} items ranked</Done>
      ) : (
        <Actions>
          <Action
            variant="primary"
            onClick={() => {
              setDone(true)
              send('use_order', { items })
            }}
          >
            {props.confirmLabel ?? 'Use this order'}
          </Action>
          <Action variant="ghost" onClick={() => live.set(initial)}>
            Reset
          </Action>
        </Actions>
      )}
    </Block>
  )
})
