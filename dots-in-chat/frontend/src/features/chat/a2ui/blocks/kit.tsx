/**
 * The visual kit every chat block is built from: the glass card, pills, stat tiles, buttons,
 * slider rows, segmented toggles. Colours come from the tokens in ../a2ui.css (`--blk-*`), so
 * blocks never hard-code a colour.
 *
 * Design reference: "Interactive & generative chat blocks" (Poppins, #252636 glass cards, soft
 * pills, indigo primary).
 */
import { useId, type ReactNode } from 'react'
import { Slider } from '@/components/shadcn/slider'
import { cn } from '@/lib/utils'

export type Tone = 'accent' | 'success' | 'warn' | 'danger' | 'muted'

/** The glass card a block sits in. `pill` is shown beside the title (e.g. "changed"). */
export function Block({
  title,
  subtitle,
  pill,
  badges,
  children,
  className,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  pill?: ReactNode
  /** Pills above the title ("Needs your OK", "Reaches 1 person"). */
  badges?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('blk-card flex flex-col gap-4 p-4 sm:p-5', className)}>
      {(title || subtitle || badges) && (
        <header className="flex flex-col gap-1">
          {badges && <div className="mb-1.5 flex flex-wrap gap-1.5">{badges}</div>}
          {title && (
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="blk-title">{title}</h3>
              {pill}
            </div>
          )}
          {subtitle && <p className="blk-sub">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

/** A small rounded label. */
export function Pill({ tone = 'muted', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('blk-pill', `blk-tone-${tone}`, className)}>{children}</span>
}

/** "changed" after the agent updated the block, "dragged"/"edited" after the user did. */
export function ChangePill({ changed, user = 'dragged' }: { changed: 'agent' | 'user' | null; user?: string }) {
  if (!changed) return null
  return <Pill tone="success">{changed === 'agent' ? 'changed' : user}</Pill>
}

/** A tile with a small label and a large number. */
export function Stat({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: Tone }) {
  return (
    <div className="blk-inset flex min-w-0 flex-col gap-1 px-3 py-2.5">
      <span className="blk-micro truncate">{label}</span>
      <span className={cn('blk-stat truncate tabular-nums', tone && `blk-text-${tone}`)}>{value}</span>
    </div>
  )
}

/** Tiles side by side, wrapping on narrow screens. */
export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">{children}</div>
}

/** A formula or worked line, in an inset box. */
export function Formula({ children }: { children: ReactNode }) {
  return <p className="blk-inset blk-formula px-3 py-2.5">{children}</p>
}

/** Small print under a block (assumptions, how it works). */
export function Footnote({ children }: { children: ReactNode }) {
  return <p className="blk-foot">{children}</p>
}

/** A labelled slider: label left, value right, indigo track. */
export function RangeRow({
  label,
  display,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: ReactNode
  display: ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (n: number) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="blk-micro">
          {label}
        </label>
        <span className="blk-value tabular-nums">{display}</span>
      </div>
      <Slider
        id={id}
        className="blk-slider"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([n]) => onChange(n)}
        aria-label={typeof label === 'string' ? label : undefined}
      />
    </div>
  )
}

/** A full-width button. Primary is the indigo call to action; ghost is a quiet text button. */
export function Action({
  variant = 'secondary',
  onClick,
  disabled,
  children,
  className,
}: {
  variant?: 'primary' | 'secondary' | 'ghost'
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <button type="button" className={cn('blk-btn', `blk-btn-${variant}`, className)} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

/** Buttons stacked, as the design stacks a block's decisions. */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>
}

export type SegmentOption = { value: string; label: ReactNode; disabled?: boolean; title?: string }

/** A small pill toggle (Bar | Line | Area). A disabled option is shown greyed out. */
export function Segmented({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentOption[]
  value: string
  onChange: (value: string) => void
  label?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="blk-seg inline-flex self-start p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          disabled={o.disabled}
          title={o.title}
          data-on={o.value === value || undefined}
          className="blk-seg-item"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** A choice chip (Today 6 pm | Tomorrow | Pick date). */
export function Chip({ on, onClick, children }: { on?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} data-on={on || undefined} className="blk-chip" onClick={onClick}>
      {children}
    </button>
  )
}

/** A circle with initials, for people. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return (
    <span aria-hidden className={cn('blk-avatar', className)}>
      {initials || '?'}
    </span>
  )
}

/** A short status line after a decision ("✓ Sent to Priya · 3:42 pm"). */
export function Done({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div role="status" className="blk-done flex items-center justify-between gap-3 px-3.5 py-2.5">
      <span className="min-w-0">{children}</span>
      {aside}
    </div>
  )
}
