/**
 * Suggestions: a follow-up question and the replies the user can tap, under a block.
 *
 * A tap sends the `say` event with the reply as `text`, plus `onScreen`: the live state of
 * every block on the surface (what the user dragged or unticked), so the agent answers from
 * what the user sees, not from what it first sent. The chat shows the tap as a plain message.
 */
import { useState } from 'react'
import { z } from 'zod'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { readBlocks, useSend } from './hooks'

const SuggestionsApi = {
  name: 'Suggestions',
  schema: z.object({
    prompt: z.string().optional().describe('The follow-up question shown above the replies.'),
    options: z.array(z.string()).describe('Two to four short replies the user can tap.'),
  }),
}

export const Suggestions = createComponentImplementation(SuggestionsApi, ({ props, context }) => {
  const send = useSend(context)
  // A tap disables the replies until the agent answers; new options from it re-enable them.
  const optionsKey = JSON.stringify(props.options ?? [])
  const [tap, setTap] = useState<{ key: string; text: string } | null>(null)
  const chosen = tap?.key === optionsKey ? tap.text : null
  return (
    <div className="flex flex-col gap-2.5">
      {props.prompt && <p className="text-sm text-[var(--blk-text)]">{props.prompt}</p>}
      <div className="flex flex-col gap-2">
        {(props.options ?? []).map((text) => (
          <button
            key={text}
            type="button"
            className="blk-suggest"
            disabled={chosen !== null}
            data-on={chosen === text || undefined}
            onClick={() => {
              setTap({ key: optionsKey, text })
              send('say', { text, onScreen: readBlocks(context) })
            }}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
})
