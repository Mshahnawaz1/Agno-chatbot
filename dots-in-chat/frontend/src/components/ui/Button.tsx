import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { ArrowUpRight } from 'lucide-react'
import clsx from 'clsx'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'pill' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-white text-black hover:bg-white/90 active:bg-white/80',
  pill: 'bg-white text-black hover:bg-white/90 active:bg-white/80 rounded-full',
  secondary: 'bg-surface-2 text-fg border border-border hover:border-border-strong hover:bg-surface-3',
  ghost: 'bg-transparent text-fg hover:bg-surface-2 active:bg-surface-3',
  danger: 'bg-transparent text-danger hover:bg-danger/10 active:bg-danger/20',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  const isPill = variant === 'pill'
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        // pill: 48px tall with a 36px chip inset 6px from the left
        isPill ? 'h-12 pl-1.5 pr-6 text-base gap-3 relative' : ['rounded-md', sizes[size]],
        className,
      )}
      {...rest}
    >
      {isPill && (
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-black text-white">
          {loading ? <Spinner /> : <ArrowUpRight className="size-5" aria-hidden />}
        </span>
      )}
      {!isPill && loading && <Spinner />}
      {children}
    </button>
  )
})
