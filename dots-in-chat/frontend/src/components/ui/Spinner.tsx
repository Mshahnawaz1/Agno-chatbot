import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={clsx('size-4 animate-spin', className)}
    />
  )
}
