/**
 * The chat catalog's own functions (server side: app/a2ui/functions.py, keep in step).
 *
 * `clientInfo` is a renderer function the agent may call (allowedCallers rendererOrAgent): the
 * browser's timezone, locale and screen. web_core refuses an agent call to any function that is
 * rendererOnly or needs a user click (requiresUserActivation), so nothing else is reachable.
 * `serverTime` lives on the agent: this renderer calls it with `callAgent` (../renderer.ts).
 */
import { z } from 'zod'
import { createFunctionImplementation } from '@a2ui/web_core/v1_0'

export const CLIENT_INFO = createFunctionImplementation(
  {
    name: 'clientInfo',
    returnType: 'object',
    allowedCallers: 'rendererOrAgent',
    description:
      "The user's browser: {timezone, locale, localTime (ISO 8601 with offset), screenWidth, screenHeight}. Called by the agent with the call_renderer_function tool.",
    schema: z.object({}).strict(),
  },
  () => {
    const now = new Date()
    const offset = -now.getTimezoneOffset()
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0')
    const zone = `${offset < 0 ? '-' : '+'}${pad(offset / 60)}:${pad(offset % 60)}`
    const local = new Date(now.getTime() + offset * 60_000).toISOString().slice(0, 19)
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
      localTime: `${local}${zone}`,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    }
  },
)
