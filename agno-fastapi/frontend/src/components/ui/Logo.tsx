import { useId } from 'react'
import clsx from 'clsx'

export function Logo({
  className,
  wordmark = false,
  size = 28,
}: {
  className?: string
  wordmark?: boolean
  size?: number
}) {
  const gid = useId()
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden={wordmark ? true : undefined} role={wordmark ? undefined : 'img'} aria-label={wordmark ? undefined : 'Agno'}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#4f6bff" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill={`url(#${gid})`} />
        <path
          d="M9 23 16 8l7 15M12 18h8"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {wordmark ? (
        <span className="font-display text-lg font-semibold tracking-tight text-fg">Agno</span>
      ) : null}
    </span>
  )
}
