export type ConnectorMeta = {
  provider: string
  /** Tile background color */
  color: string
  /** Glyph/monogram text color */
  textColor: string
  monogram: string
  /** Logo path under /connectors, when we have one */
  logo?: string
}

const META: Record<string, Omit<ConnectorMeta, 'monogram' | 'textColor'> & { textColor?: string; monogram?: string }> = {
  reclaim: { provider: 'Reclaim.ai', color: '#2f7cf6' },
  todoist: { provider: 'Doist', color: '#e44332' },
  habitify: { provider: 'Habitify', color: '#7c5cff' },
  sunsama: { provider: 'Sunsama', color: '#f5a524', textColor: '#1a1206' },
  fathom: { provider: 'Fathom', color: '#00c389', textColor: '#04251b' },
  typeform: { provider: 'Typeform', color: '#262627' },
}

export function getConnectorMeta(id: string, name: string): ConnectorMeta {
  const m = META[id]
  const monogram = (m?.monogram ?? name.trim().charAt(0) ?? '?').toUpperCase() || '?'
  if (!m) return { provider: 'Custom', color: '#3a3a48', textColor: '#ffffff', monogram }
  return { provider: m.provider, color: m.color, textColor: m.textColor ?? '#ffffff', monogram, logo: `/connectors/${id}.png` }
}
