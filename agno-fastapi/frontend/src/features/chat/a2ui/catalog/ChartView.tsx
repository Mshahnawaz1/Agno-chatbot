import { useEffect, useRef, useState } from 'react'

/** Vega's look, matched to the surface theme (a2ui.css): transparent, white lines, grey axes. */
const THEME = {
  background: 'transparent',
  font: 'Inter Variable, ui-sans-serif, system-ui, sans-serif',
  view: { stroke: 'transparent' },
  axis: {
    domainColor: 'rgba(255,255,255,0.16)',
    gridColor: 'rgba(255,255,255,0.08)',
    tickColor: 'rgba(255,255,255,0.16)',
    labelColor: '#afafaf',
    titleColor: '#afafaf',
    labelFontSize: 12,
    titleFontWeight: 500,
  },
  legend: { labelColor: '#d4d4d4', titleColor: '#afafaf', orient: 'bottom' },
  title: { color: '#f5f5f5', fontWeight: 600, anchor: 'start' },
  text: { color: '#f5f5f5' },
  range: { category: ['#ffffff', '#10a37f', '#8b8b8b', '#f5a524', '#7c9cff', '#f87171'] },
  line: { strokeWidth: 2.5 },
  point: { filled: true },
}

/**
 * Draws a Vega-Lite spec. vega-embed (most of a megabyte) loads only when a chart is shown.
 * Data must be inline: the loader refuses URLs, so a spec can't make the browser fetch anything.
 */
export function ChartView({ spec, height }: { spec: unknown; height: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  // Re-embed only when the spec's content changes, not on every render.
  const key = JSON.stringify(spec ?? null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let finalize: (() => void) | undefined
    let cancelled = false
    setError(null)
    void (async () => {
      try {
        const [{ default: embed }, vega] = await Promise.all([import('vega-embed'), import('vega')])
        if (cancelled) return
        const loader = vega.loader()
        loader.sanitize = () => Promise.reject(new Error('Charts can only use inline data.'))
        const base = JSON.parse(key) as Record<string, unknown> | null
        if (!base || typeof base !== 'object') throw new Error('The chart has no spec.')
        const result = await embed(
          el,
          { width: 'container', height, autosize: { type: 'fit-x', contains: 'padding' }, ...base } as never,
          { actions: false, renderer: 'svg', config: THEME as never, loader },
        )
        if (cancelled) result.finalize()
        else finalize = result.finalize
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'The chart could not be drawn.')
      }
    })()
    return () => {
      cancelled = true
      finalize?.()
    }
  }, [key, height])

  return (
    <div className="a2ui-chart w-full">
      <div ref={ref} className="w-full" style={{ minHeight: height }} />
      {error ? <p className="text-sm text-destructive">Couldn't draw this chart: {error}</p> : null}
    </div>
  )
}
