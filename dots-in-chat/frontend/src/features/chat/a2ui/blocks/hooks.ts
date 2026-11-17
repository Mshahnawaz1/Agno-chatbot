/**
 * What every chat block shares: sending its own events, and live state that follows the agent.
 *
 * A block owns its interaction. It keeps what the user changes (a dragged slider, an unticked
 * person) in local state, so numbers recalculate in the browser with no round trip. That state
 * is also written to the surface's data model at `/blocks/<componentId>`, which is how a
 * Suggestions chip can tell the agent what is on screen when it is tapped.
 */
import { useEffect, useState } from 'react'
import type { ComponentContext } from '@a2ui/web_core/v1_0'

/** Sends one of the block's events to the agent, as an A2UI action. */
export function useSend(context: ComponentContext) {
  return (name: string, eventContext: Record<string, unknown> = {}) =>
    void context.dispatchAction({ event: { name, context: eventContext } })
}

/** Where blocks keep their live state in the data model. */
export const BLOCKS_PATH = '/blocks'

/** Every block's live state on this surface, keyed by component id. */
export function readBlocks(context: ComponentContext): Record<string, unknown> {
  const value = context.dataContext.dataModel.get(BLOCKS_PATH) as unknown
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export type Live<T> = {
  value: T
  set: (next: T | ((prev: T) => T)) => void
  /** Why the shown values differ from the first render: the agent updated it, or the user did. */
  changed: 'agent' | 'user' | null
}

/**
 * Local state seeded from the block's props. When the agent updates the block in place (new
 * props), the state resets to them and `changed` becomes 'agent'; when the user edits it,
 * 'user'. The current value is mirrored to the data model for Suggestions to read.
 */
export function useLive<T>(context: ComponentContext, initial: T): Live<T> {
  const key = JSON.stringify(initial)
  const [state, setState] = useState<{ key: string; value: T; changed: Live<T>['changed'] }>({
    key,
    value: initial,
    changed: null,
  })
  let current = state
  if (state.key !== key) {
    // New props from the agent: adjust during render (React's documented pattern).
    current = { key, value: initial, changed: 'agent' }
    setState(current)
  }

  const id = context.componentModel.id
  const json = JSON.stringify(current.value)
  useEffect(() => {
    context.dataContext.set(`${BLOCKS_PATH}/${id}`, JSON.parse(json))
  }, [context, id, json])

  return {
    value: current.value,
    changed: current.changed,
    set: (next) =>
      setState((s) => ({
        ...s,
        value: typeof next === 'function' ? (next as (p: T) => T)(s.value) : next,
        changed: 'user',
      })),
  }
}

/** A countdown in whole seconds that calls `onDone` at zero; null while not running. */
export function useCountdown(onDone: () => void) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    if (left === null) return
    const t = setTimeout(() => {
      if (left > 1) setLeft(left - 1)
      else {
        setLeft(null)
        onDone()
      }
    }, 1000)
    return () => clearTimeout(t)
  }, [left, onDone])
  return { left, start: (seconds: number) => setLeft(seconds), cancel: () => setLeft(null) }
}
