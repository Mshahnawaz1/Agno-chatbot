/**
 * VegaChart: the official A2UI VegaChart component (a2ui-project/a2ui
 * `catalogs/vegachart/v1/catalog.json`): a Vega-Lite spec, drawn with vega-embed.
 * Its params with `bind` are the chart's own inputs, so a calculator recomputes live in the
 * browser as the user drags, with no round trip to the agent.
 */
import { z } from 'zod'
import { DynamicNumberSchema, DynamicValueSchema, WeightSchema } from '@a2ui/web_core/v1_0'
import { ChartView } from './ChartView'
import { implement } from './aria'
import { weightStyle } from './props'

const VegaChartApi = {
  name: 'VegaChart',
  schema: z
    .object({
      spec: DynamicValueSchema.describe('The Vega-Lite spec to render as a JSON object.'),
      height: DynamicNumberSchema.optional().describe('Optional height of the chart in pixels. Defaults to 290.'),
      weight: WeightSchema.optional(),
    })
    .describe('Displays a Vega or Vega-Lite chart.'),
}

export const VegaChart = implement(VegaChartApi, ({ props }) => (
  <div style={weightStyle(props.weight)} className="min-w-0">
    <ChartView spec={props.spec} height={typeof props.height === 'number' ? props.height : 290} />
  </div>
))
