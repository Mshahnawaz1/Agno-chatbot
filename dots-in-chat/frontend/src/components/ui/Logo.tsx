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
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <img
        src="/logo.png"
        width={size}
        height={size}
        alt={wordmark ? '' : 'Dots-in Chat'}
        aria-hidden={wordmark ? true : undefined}
        draggable={false}
        className="select-none"
      />
      {wordmark ? (
        <span className="font-display text-lg font-semibold tracking-tight text-fg">Dots-in Chat</span>
      ) : null}
    </span>
  )
}
