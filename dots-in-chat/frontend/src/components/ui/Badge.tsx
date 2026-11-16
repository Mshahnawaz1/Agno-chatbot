import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'accent'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-3 text-fg-muted border-border',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  accent: 'bg-accent/15 text-[#c4b0ff] border-accent/40',
}

export function Badge({ variant = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium leading-5',
        variants[variant],
        className,
      )}
      {...rest}
    />
  )
}
