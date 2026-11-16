/**
 * ReminderPicker: choose when to be reminded, how long before, and whether to repeat.
 * Quick choices come from `options` (first selected); "Pick date…" reveals a datetime-local
 * input. All choices are live state; a summary line recomputes from them. Buttons send
 * `set_reminder` / `add_to_calendar` ({title, at, remindBefore, repeatDays}) or
 * `dismiss_reminder` ({}); afterwards a line shows what was decided.
 */
import { useState, type ReactNode } from 'react'
import { z } from 'zod'
import { Minus, Plus } from 'lucide-react'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Action, Actions, Block, ChangePill, Chip, Done, RangeRow } from './kit'
import { useLive, useSend } from './hooks'
import { beforeLabel, defaultOptions, repeatLabel, repeatPhrase, whenLabel } from './reminder-math'

const ReminderPickerApi = {
  name: 'ReminderPicker',
  schema: z.object({
    title: z.string().describe('What to remind about, e.g. "Review the report".'),
    options: z
      .array(
        z.object({
          label: z.string().describe('Chip text, e.g. "Today 6 pm".'),
          at: z.string().describe('Local ISO datetime, e.g. "2026-11-16T18:00".'),
        }),
      )
      .optional()
      .describe('Quick time choices; the first is selected. Defaults to today 6 pm and tomorrow 9 am.'),
    remindBefore: z.number().optional().describe('Minutes before the time to remind (0-120). Default 0.'),
    repeatDays: z.number().optional().describe('Repeat every N days; 0 = never. Default 0.'),
  }),
}

type State = { at: string; custom: boolean; before: number; repeat: number }

export const ReminderPicker = createComponentImplementation(ReminderPickerApi, ({ props, context }) => {
  const options = props.options?.length ? props.options : defaultOptions()
  const live = useLive<State>(context, {
    at: options[0].at,
    custom: false,
    before: props.remindBefore ?? 0,
    repeat: props.repeatDays ?? 0,
  })
  const send = useSend(context)
  const [decision, setDecision] = useState<string | null>(null)
  const s = live.value
  const set = (patch: Partial<State>) => live.set((p) => ({ ...p, ...patch }))
  const payload = { title: props.title, at: s.at, remindBefore: s.before, repeatDays: s.repeat }
  const when = whenLabel(s.at)

  return (
    <Block title="Reminder" subtitle={props.title} pill={<ChangePill changed={live.changed} user="edited" />}>
      <div className="flex flex-col gap-2">
        <span className="blk-micro">When</span>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <Chip key={o.at + o.label} on={!s.custom && s.at === o.at} onClick={() => set({ at: o.at, custom: false })}>
              {o.label}
            </Chip>
          ))}
          <Chip on={s.custom} onClick={() => set({ custom: true })}>
            Pick date…
          </Chip>
        </div>
        {s.custom && (
          <input
            type="datetime-local"
            aria-label="Reminder date and time"
            value={s.at}
            onChange={(e) => e.target.value && set({ at: e.target.value })}
            className="blk-inset w-full px-3 py-2 text-sm text-[var(--blk-text)] [color-scheme:dark]"
          />
        )}
      </div>

      <RangeRow
        label="Remind me in"
        display={<span className="text-[var(--blk-accent-hi)]">{beforeLabel(s.before)}</span>}
        value={s.before}
        min={0}
        max={120}
        step={5}
        onChange={(n) => set({ before: n })}
      />

      <div className="flex items-center justify-between gap-3">
        <span className="blk-micro">Repeat every</span>
        <div className="flex items-center gap-4 rounded-full border border-white/10 bg-white/[0.04] p-1">
          <RoundBtn label="Repeat less often" disabled={s.repeat <= 0} onClick={() => set({ repeat: Math.max(0, s.repeat - 1) })}>
            <Minus className="size-3.5" />
          </RoundBtn>
          <span className="min-w-10 text-center text-[0.8125rem] font-medium tabular-nums text-[var(--blk-text)]" aria-live="polite">
            {repeatLabel(s.repeat)}
          </span>
          <RoundBtn label="Repeat more often" disabled={s.repeat >= 30} onClick={() => set({ repeat: s.repeat + 1 })}>
            <Plus className="size-3.5" />
          </RoundBtn>
        </div>
      </div>

      <p className="blk-inset px-3.5 py-3 text-[0.8125rem] text-[var(--blk-accent-hi)]">
        {when}
        {repeatPhrase(s.repeat)}
      </p>

      {decision === null ? (
        <>
          <p className="text-sm text-[var(--blk-text)]">Shall I set it?</p>
          <Actions>
            <Action
              variant="primary"
              onClick={() => {
                setDecision(`✓ Reminder set · ${when}`)
                send('set_reminder', payload)
              }}
            >
              Set reminder
            </Action>
            <Action
              onClick={() => {
                setDecision(`✓ Added to calendar · ${when}`)
                send('add_to_calendar', payload)
              }}
            >
              Add to calendar instead
            </Action>
            <Action
              variant="ghost"
              onClick={() => {
                setDecision('No reminder set')
                send('dismiss_reminder', {})
              }}
            >
              Not now
            </Action>
          </Actions>
        </>
      ) : (
        <Done>{decision}</Done>
      )}
    </Block>
  )
})

function RoundBtn({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-full bg-white/10 text-[var(--blk-text)] transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blk-accent-hi)] disabled:opacity-40"
    >
      {children}
    </button>
  )
}
