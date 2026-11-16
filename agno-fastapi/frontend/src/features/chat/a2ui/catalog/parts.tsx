/** Small building blocks shared by the catalog's components. */
import { useState, type ReactNode } from 'react'
import type { ResolvedChildRef } from '@a2ui/web_core/v1_0'
import { Label } from '@/components/shadcn/label'
import { cn } from '@/lib/utils'
import type { FieldProps } from './props'

/** A ChildList: ids, or template instances that carry their own data path. */
export function Children({
  items,
  buildChild,
}: {
  items: (string | ResolvedChildRef)[] | undefined
  buildChild: (id: string, basePath?: string) => ReactNode
}) {
  return (items ?? []).map((c) =>
    typeof c === 'string' ? (
      <div key={c} className="min-w-0">{buildChild(c)}</div>
    ) : (
      <div key={`${c.id}@${c.basePath}`} className="min-w-0">{buildChild(c.id, c.basePath)}</div>
    ),
  )
}

/** Label above the control and check messages below it. */
export function Field({
  props,
  id,
  children,
  as = 'label',
  className,
}: {
  props: FieldProps
  id?: string
  children: ReactNode
  /** 'legend' for a group of controls (ChoicePicker), which has no single control to label. */
  as?: 'label' | 'legend'
  className?: string
}) {
  // Check messages wait until the user has used the field, so a fresh form isn't all red.
  // (A submit button with a failing check stays disabled either way.)
  const [touched, setTouched] = useState(false)
  const touch = () => setTouched(true)
  const errors = touched && props.isValid === false && props.validationErrors?.length ? props.validationErrors : null
  const Root = as === 'legend' ? 'fieldset' : 'div'
  return (
    <Root
      className={cn('a2ui-field flex min-w-0 flex-col gap-2.5', className)}
      data-touched={touched || undefined}
      onBlurCapture={touch}
      onPointerDownCapture={touch}
    >
      {props.label &&
        (as === 'legend' ? (
          <legend className="a2ui-label mb-2.5">{props.label}</legend>
        ) : (
          <Label htmlFor={id} className="a2ui-label">
            {props.label}
          </Label>
        ))}
      {children}
      {errors && (
        <ul id={id ? `${id}-errors` : undefined} className="flex flex-col gap-0.5 text-xs text-destructive">
          {errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
    </Root>
  )
}

/** One control and its label on a line: checkboxes, radio buttons. */
export function Option({ id, label, children }: { id: string; label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      {children}
      <Label htmlFor={id} className="a2ui-option">
        {label}
      </Label>
    </div>
  )
}
