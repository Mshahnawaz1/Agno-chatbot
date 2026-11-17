import { createElement, type ReactNode } from 'react'
import { createComponentImplementation } from '@a2ui/react/v0_9'

/** The `accessibility` attributes every A2UI component may carry (label, description, live). */
type Accessibility = { label?: string; description?: string; live?: 'off' | 'polite' | 'assertive' }

/** `accessibility` as ARIA attributes: label -> aria-label, description -> aria-description, live -> aria-live. */
export function ariaAttrs(a: Accessibility | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (a?.label) out['aria-label'] = String(a.label)
  if (a?.description) out['aria-description'] = String(a.description)
  if (a?.live && a.live !== 'off') out['aria-live'] = a.live
  return out
}

/**
 * createComponentImplementation, plus `accessibility` in the DOM for every component. A component
 * that draws one natural element spreads ariaAttrs(props.accessibility) on it itself (Button, Image, using
 * createComponentImplementation directly); any other gets a layout-neutral `role="group"` wrapper carrying the attributes.
 */
export const implement: typeof createComponentImplementation = ((
  api: Parameters<typeof createComponentImplementation>[0],
  render: Parameters<typeof createComponentImplementation>[1],
) =>
  createComponentImplementation(api, (p) => {
    const node = render(p)
    const attrs = ariaAttrs((p.props as { accessibility?: Accessibility }).accessibility)
    if (!Object.keys(attrs).length) return node
    return createElement('div', { role: 'group', style: { display: 'contents' }, ...attrs }, node as ReactNode)
  })) as typeof createComponentImplementation
