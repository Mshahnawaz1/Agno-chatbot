import { cloneElement, useId, type ReactElement, type ReactNode } from 'react'
import clsx from 'clsx'

export interface FieldProps {
  label: string
  hint?: ReactNode
  error?: ReactNode
  className?: string
  /** A single form control (Input, textarea...). Field injects id, aria-describedby and aria-invalid. */
  children: ReactElement<Record<string, unknown>>
}

export function Field({ label, hint, error, className, children }: FieldProps) {
  const uid = useId()
  const id = (children.props.id as string | undefined) ?? `${uid}-field`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="text-sm text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
