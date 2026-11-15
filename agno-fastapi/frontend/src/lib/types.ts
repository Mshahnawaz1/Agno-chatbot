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
