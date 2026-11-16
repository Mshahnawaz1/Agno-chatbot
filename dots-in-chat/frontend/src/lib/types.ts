export type Metrics = {
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  time_to_first_token?: number
  duration?: number
  num_tools?: number
  tools?: { name: string; args: unknown; result: unknown }[]
  [k: string]: unknown
}

export type Message = {
  role: 'user' | 'assistant'
  content: string
  metrics?: Metrics | null
  /** Assistant replies since A2UI v1.0: text and A2UI wire messages, in order. */
  parts?: ({ type: 'text'; text: string } | { type: 'a2ui'; message: Record<string, unknown> & { version: string } })[] | null
  /** Assistant replies: the model's thoughts, if it shared any. */
  reasoning?: string | null
  /** User turns started by a click on a surface. */
  action?: {
    name: string
    surfaceId: string
    sourceComponentId: string
    timestamp: string
    context: Record<string, unknown>
  } | null
}

export type Session = {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export type Connector = {
  id: string
  name: string
  notes: string
  url: string
  scopes: string[]
  tools: string[] | null
  connected: boolean
  enabled: boolean
  skill: string | null
}

export type Skill = {
  name: string
  description: string
  allowed_tools: string[]
  instructions: string
}

export type User = {
  id: string
  email: string
  name: string | null
  created_at: string
}
