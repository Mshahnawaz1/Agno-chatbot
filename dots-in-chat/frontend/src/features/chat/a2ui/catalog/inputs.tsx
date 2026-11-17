/**
 * Input components: Button, TextField, CheckBox, ChoicePicker, Slider, DateTimeInput.
 *
 * Each writes the user's edits back to the surface's data model with `setValue`, so a Button's
 * action (and its checks) see them. `isValid`/`validationErrors` come from the component's checks.
 */
import { useId, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  ButtonApi, CheckBoxApi, ChoicePickerApi, DateTimeInputApi, SliderApi, TextFieldApi,
} from '@a2ui/web_core/v1_0'
import { Button as ShadcnButton } from '@/components/shadcn/button'
import { Checkbox } from '@/components/shadcn/checkbox'
import { Input } from '@/components/shadcn/input'
import { Label } from '@/components/shadcn/label'
import { RadioGroup, RadioGroupItem } from '@/components/shadcn/radio-group'
import { Slider as ShadcnSlider } from '@/components/shadcn/slider'
import { Textarea } from '@/components/shadcn/textarea'
import { Toggle } from '@/components/shadcn/toggle'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { ariaAttrs, implement } from './aria'
import { Field, Option } from './parts'
import { invalidProps, weightStyle } from './props'

const buttonVariant = { primary: 'default', default: 'outline', borderless: 'ghost' } as const

export const Button = createComponentImplementation(ButtonApi, ({ props, buildChild }) => {
  // isValid is false while a check fails: the button stays disabled until the form is valid.
  const disabled = props.isValid === false
  return (
    <ShadcnButton
      type="button"
      variant={buttonVariant[props.variant ?? 'default']}
      style={weightStyle(props.weight)}
      className="a2ui-button self-start rounded-full px-5"
      disabled={disabled}
      {...ariaAttrs(props.accessibility)}
      onClick={() => {
        if (!disabled) void props.action?.()
      }}
    >
      {props.child ? buildChild(props.child) : null}
    </ShadcnButton>
  )
})

const inputType = { shortText: 'text', number: 'number', obscured: 'password' } as const

export const TextField = implement(TextFieldApi, ({ props }) => {
  const id = useId()
  const common = {
    id,
    value: props.value ?? '',
    placeholder: props.placeholder ?? undefined,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => props.setValue?.(e.target.value),
    ...invalidProps(props, id),
  }
  return (
    <Field props={props} id={id}>
      {props.variant === 'longText' ? (
        <Textarea {...common} className="min-h-20" />
      ) : (
        <Input {...common} type={inputType[props.variant ?? 'shortText']} />
      )}
    </Field>
  )
})

export const CheckBox = implement(CheckBoxApi, ({ props }) => {
  const id = useId()
  return (
    <Field props={{ ...props, label: undefined }} id={id}>
      <Option id={id} label={props.label}>
        <Checkbox
          id={id}
          className="size-5"
          checked={props.value === true}
          onCheckedChange={(checked) => props.setValue?.(checked === true)}
          {...invalidProps(props, id)}
        />
      </Option>
    </Field>
  )
})

/** A string array whichever way the value arrives (one choice may come as a string). */
function selectedValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  return typeof value === 'string' && value ? [value] : []
}

export const ChoicePicker = implement(ChoicePickerApi, ({ props }) => {
  const id = useId()
  const [filter, setFilter] = useState('')
  const selected = selectedValues(props.value)
  const multi = props.variant === 'multipleSelection'
  const toggle = (value: string) => {
    if (!multi) props.setValue?.([value])
    else props.setValue?.(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }
  const needle = filter.trim().toLowerCase()
  const options = (props.options ?? []).filter(
    (o) => !props.filterable || !needle || String(o.label).toLowerCase().includes(needle),
  )

  let control: ReactNode
  if (props.displayStyle === 'chips') {
    control = (
      <div className="flex flex-wrap gap-2" role="group" aria-label={props.label || undefined}>
        {options.map((o) => (
          <Toggle
            key={o.value}
            variant="outline"
            className="a2ui-chip rounded-full px-4"
            pressed={selected.includes(o.value)}
            onPressedChange={() => toggle(o.value)}
          >
            {o.label}
          </Toggle>
        ))}
      </div>
    )
  } else if (multi) {
    control = (
      <div className="flex flex-col gap-3.5">
        {options.map((o) => (
          <Option key={o.value} id={`${id}-${o.value}`} label={o.label}>
            <Checkbox
              id={`${id}-${o.value}`}
              className="size-5"
              checked={selected.includes(o.value)}
              onCheckedChange={() => toggle(o.value)}
            />
          </Option>
        ))}
      </div>
    )
  } else {
    control = (
      <RadioGroup
        value={selected[0] ?? ''}
        onValueChange={toggle}
        aria-label={props.label || undefined}
        className="gap-3.5"
      >
        {options.map((o) => (
          <Option key={o.value} id={`${id}-${o.value}`} label={o.label}>
            <RadioGroupItem id={`${id}-${o.value}`} value={o.value} className="a2ui-radio size-5" />
          </Option>
        ))}
      </RadioGroup>
    )
  }

  return (
    <Field props={props} id={id} as="legend">
      {props.filterable && (
        <Input
          type="search"
          placeholder="Filter options…"
          aria-label="Filter options"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      )}
      {control}
    </Field>
  )
})

export const Slider = implement(SliderApi, ({ props }) => {
  const id = useId()
  const min = props.min ?? 0
  const max = props.max ?? 100
  const value = typeof props.value === 'number' ? props.value : min
  // `steps` is the number of steps across the range (v1.0); none means continuous.
  const step = props.steps ? (max - min) / props.steps : 1
  return (
    <Field props={{ ...props, label: undefined }} id={id}>
      <div className="flex items-baseline justify-between gap-4">
        <Label htmlFor={id} className="a2ui-label">
          {props.label}
        </Label>
        <span className="text-sm text-fg-muted tabular-nums">{value}</span>
      </div>
      <ShadcnSlider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([n]) => props.setValue?.(n)}
        aria-label={props.label || undefined}
        className="py-1.5"
      />
    </Field>
  )
})

const DATE_RE = /^\d{4}-\d{2}-\d{2}/
const TIME_RE = /(?:^|T)(\d{2}:\d{2})/

const datePart = (value: string) => DATE_RE.exec(value)?.[0] ?? ''
const timePart = (value: string) => TIME_RE.exec(value)?.[1] ?? ''

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const DateTimeInput = implement(DateTimeInputApi, ({ props }) => {
  const id = useId()
  const enableTime = props.enableTime ?? false
  // Neither flag set: a date, as the basic DateTimeInput does.
  const enableDate = props.enableDate ?? !enableTime
  const raw = typeof props.value === 'string' ? props.value : ''
  const min = typeof props.min === 'string' ? props.min : ''
  const max = typeof props.max === 'string' ? props.max : ''
  // The ISO 8601 shapes the basic component writes: "2026-11-21", "18:30", "2026-11-21T18:30:00".
  const onDate = (date: string) => props.setValue?.(enableTime ? `${date}T${timePart(raw) || '00:00'}:00` : date)
  const onTime = (time: string) => props.setValue?.(enableDate ? `${datePart(raw) || today()}T${time}:00` : time)
  const fieldId = enableDate ? id : `${id}-time`
  return (
    <Field props={props} id={fieldId}>
      <div className="flex flex-wrap gap-2">
        {enableDate && (
          <Input
            id={id}
            type="date"
            className="w-auto [color-scheme:dark]"
            value={datePart(raw)}
            min={datePart(min) || undefined}
            max={datePart(max) || undefined}
            onChange={(e) => onDate(e.target.value)}
            {...invalidProps(props, fieldId)}
          />
        )}
        {enableTime && (
          <Input
            id={`${id}-time`}
            type="time"
            className="w-auto [color-scheme:dark]"
            value={timePart(raw)}
            min={timePart(min) || undefined}
            max={timePart(max) || undefined}
            onChange={(e) => onTime(e.target.value)}
            {...invalidProps(props, fieldId)}
          />
        )}
      </div>
    </Field>
  )
})
