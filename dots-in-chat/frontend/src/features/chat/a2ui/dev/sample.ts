/** A gallery sample: one surface, as the server would send it in createSurface. */
export type Sample = {
  /** Surface id; also the ?only= filter prefix. */
  id: string
  title: string
  /** The user's message and the agent's lead sentence, drawn around the surface for context. */
  user?: string
  lead?: string
  /** Flat v1.0 component list; one must have id "root". */
  components: Record<string, unknown>[]
  data?: Record<string, unknown>
  /** Components a later agent turn sends (updateComponents), applied by an "Agent update" button. */
  update?: Record<string, unknown>[]
}
