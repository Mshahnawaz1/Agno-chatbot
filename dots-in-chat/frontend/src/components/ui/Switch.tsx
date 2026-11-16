import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import * as RadixSwitch from '@radix-ui/react-switch'
import clsx from 'clsx'

export const Switch = forwardRef<
  ElementRef<typeof RadixSwitch.Root>,
  ComponentPropsWithoutRef<typeof RadixSwitch.Root>
>(function Switch({ className, ...rest }, ref) {
  return (
    <RadixSwitch.Root
      ref={ref}
      className={clsx(
        'inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border-strong bg-surface-3 p-0.5 transition-colors',
        'data-[state=checked]:border-accent data-[state=checked]:bg-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      <RadixSwitch.Thumb className="block size-[18px] rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5" />
    </RadixSwitch.Root>
  )
})
