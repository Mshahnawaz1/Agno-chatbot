export type SseEvent = { event: string; data: unknown }

function parseFrame(frame: string): SseEvent | null {
  let event = 'message'
  const dataLines: string[] = []

  for (const line of frame.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''))
  }

  if (dataLines.length === 0) return null
  const raw = dataLines.join('\n')
  try {
    return { event, data: JSON.parse(raw) }
  } catch (err) {
    console.error('SSE JSON parsing error:', raw)
    throw err
  }
}

/** Reads the response body and yields { event, data } as frames arrive. */
export async function* readSseEvents(response: Response): AsyncGenerator<SseEvent> {
  if (!response.body) throw new Error('Response body is empty')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })

      // Complete frames end with a blank line; keep the unfinished tail.
      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() ?? ''

      for (const frame of frames) {
        if (!frame.trim()) continue
        const parsed = parseFrame(frame)
        if (parsed) yield parsed
      }

      if (done) {
        if (buffer.trim()) {
          const parsed = parseFrame(buffer)
          if (parsed) yield parsed
        }
        break
      }
    }
  } finally {
    reader.releaseLock()
  }
}
