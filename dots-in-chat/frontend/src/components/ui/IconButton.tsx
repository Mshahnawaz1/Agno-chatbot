import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'
import { Tooltip } from './Tooltip'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  'aria-label': string
  /** Tooltip text; pass true to reuse the aria-label, false to disable. Default true. */
  tooltip?: string | boolean
  variant?: 'ghost' | 'secondary' | 'solid'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants = {
  ghost: 'bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg active:bg-surface-3',
  secondary: 'bg-surface-3 text-fg hover:bg-surface-3/70 border border-border',
  solid: 'bg-white text-black hover:bg-white/90',
}
const sizes = { sm: 'size-8', md: 'size-9', lg: 'size-10' }

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', tooltip = true, className, children, type = 'button', ...rest },
  ref,
) {
  const btn = (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-md transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
  const text = tooltip === true ? rest['aria-label'] : tooltip
  return text ? <Tooltip content={text}>{btn}</Tooltip> : btn
})
