import type { ReactNode } from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={300} skipDelayDuration={150}>
      {children}
    </RadixTooltip.Provider>
  )
}

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/** Wraps a single focusable child (asChild). */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="z-[60] rounded-sm border border-border-strong bg-surface-3 px-2 py-1 text-xs font-medium text-fg shadow-lg"
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
