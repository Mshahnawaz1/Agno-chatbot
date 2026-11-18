import type { ReactNode } from 'react'
import { Dialog as RadixDialog } from 'radix-ui'
import { X } from 'lucide-react'
import clsx from 'clsx'

export const Dialog = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger
export const DialogClose = RadixDialog.Close

export interface DialogContentProps {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Tailwind max-width class; default max-w-lg */
  className?: string
  /** Visually hide the title (still announced to screen readers). */
  hideTitle?: boolean
}

export function DialogContent({ title, description, children, className, hideTitle }: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
      <RadixDialog.Content
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={clsx(
          'fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
          'overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-2xl',
          className,
        )}
      >
        <div className={clsx('mb-4 pr-8', hideTitle && 'sr-only')}>
          <RadixDialog.Title className="font-display text-xl font-semibold tracking-tight text-fg">
            {title}
          </RadixDialog.Title>
          {description ? (
            <RadixDialog.Description className="mt-1 text-sm text-fg-muted">
              {description}
            </RadixDialog.Description>
          ) : null}
        </div>
        {children}
        <RadixDialog.Close
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X className="size-4" aria-hidden />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}
