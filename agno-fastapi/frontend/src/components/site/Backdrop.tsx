import clsx from 'clsx'
import { Orb } from './Orb'

/**
 * The landing hero's backdrop: dust, a violet wash and the animated orb, faded
 * out toward the bottom so it never ends on a hard edge. Place it inside a
 * `relative isolate` parent.
 */
export function Backdrop({
  className,
  orbClassName = 'top-4 w-[min(1100px,150vw)] sm:-top-8',
  fadeAt = '55%',
  fadeTop = false,
}: {
  className?: string
  /** Position and size of the orb. */
  orbClassName?: string
  /** Where the bottom fade starts. */
  fadeAt?: string
  /** Also fade in from the top, for use below a header. */
  fadeTop?: boolean
}) {
  return (
    <div
      aria-hidden
      className={clsx('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
      style={{
        maskImage: `linear-gradient(to bottom, ${fadeTop ? 'transparent, #000 25%,' : ''} #000 ${fadeAt}, transparent 95%)`,
      }}
    >
      <div className="bg-stars absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-[900px] bg-[radial-gradient(ellipse_70%_55%_at_50%_30%,rgb(91_33_182/0.45),transparent_70%)]" />
      <Orb className={clsx('absolute left-1/2 aspect-square -translate-x-1/2 opacity-90', orbClassName)} />
    </div>
  )
}
