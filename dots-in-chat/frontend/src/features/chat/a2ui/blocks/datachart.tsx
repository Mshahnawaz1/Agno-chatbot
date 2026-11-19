/**
 * DataChart: a line, bar or scatter chart of rows the agent took from an uploaded CSV or a tool
 * result, drawn with Recharts. The agent passes the rows and names the columns; the block does
 * no analysis. Rows are capped (MAX_ROWS) so a big file cannot freeze the page, and the card
 * says when it cut them. Sends no events.
 */
import { z } from 'zod'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Block, Footnote } from './kit'
import { SERIES } from './format'

const MAX_ROWS = 500

const Cell = z.union([z.string(), z.number(), z.null()])

const DataChartApi = {
  name: 'DataChart',
  schema: z.object({
    title: z.string().describe('Card title, e.g. "Monthly sales".'),
    type: z.enum(['line', 'bar', 'scatter']).describe('line: values over an ordered x (time). bar: compare categories. scatter: two numeric columns against each other.'),
    data: z.array(z.record(z.string(), Cell)).describe('The rows: flat objects, one per point, keyed by column name.'),
    x: z.string().describe('Column for the x axis.'),
    y: z.array(z.string()).describe('Column(s) for the y axis, one series each. Scatter uses the first.'),
    group: z.string().optional().describe('Scatter only: a column whose values colour the points.'),
    xLabel: z.string().optional().describe('X axis title. Defaults to the x column name.'),
    yLabel: z.string().optional().describe('Y axis title.'),
    note: z.string().optional().describe('Footnote, e.g. where the data came from.'),
  }),
}

type Row = Record<string, string | number | null>

function numeric(rows: Row[], key: string): boolean {
  return rows.length > 0 && rows.every((r) => r[key] === null || r[key] === undefined || typeof r[key] === 'number')
}

const axis = { stroke: 'var(--color-fg-subtle)', fontSize: 11, tickLine: false } as const
const tip = {
  contentStyle: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'var(--color-fg-muted)' },
}

function Plot({ type, rows, x, y, group, xLabel, yLabel }: { type: 'line' | 'bar' | 'scatter'; rows: Row[]; x: string; y: string[]; group?: string; xLabel?: string; yLabel?: string }) {
  const margin = { top: 8, right: 12, bottom: xLabel ? 18 : 4, left: 4 }
  const xProps = { dataKey: x, ...axis, label: xLabel ? { value: xLabel, position: 'insideBottom' as const, offset: -10, fill: 'var(--color-fg-subtle)', fontSize: 11 } : undefined }
  const yProps = { ...axis, width: 52, label: yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' as const, fill: 'var(--color-fg-subtle)', fontSize: 11 } : undefined }
  const grid = <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
  const legend = y.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null

  if (type === 'bar') {
    return (
      <BarChart data={rows} margin={margin}>
        {grid}<XAxis {...xProps} /><YAxis {...yProps} /><Tooltip {...tip} cursor={{ fill: 'var(--color-surface-3)', opacity: 0.4 }} />{legend}
        {y.map((k, i) => <Bar key={k} dataKey={k} fill={SERIES[i % SERIES.length]} radius={[4, 4, 0, 0]} />)}
      </BarChart>
    )
  }
  if (type === 'line') {
    return (
      <LineChart data={rows} margin={margin}>
        {grid}<XAxis {...xProps} /><YAxis {...yProps} /><Tooltip {...tip} />{legend}
        {y.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={SERIES[i % SERIES.length]} strokeWidth={2} dot={rows.length <= 40} connectNulls />)}
      </LineChart>
    )
  }
  const groups = group ? [...new Set(rows.map((r) => String(r[group] ?? '')))] : [null]
  return (
    <ScatterChart margin={margin}>
      {grid}<XAxis {...xProps} type="number" name={x} domain={['auto', 'auto']} /><YAxis {...yProps} dataKey={y[0]} type="number" name={y[0]} domain={['auto', 'auto']} />
      <Tooltip {...tip} cursor={{ strokeDasharray: '3 3' }} />{groups.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
      {groups.map((g, i) => (
        <Scatter key={g ?? 'all'} name={g ?? y[0]} data={g === null ? rows : rows.filter((r) => String(r[group!] ?? '') === g)} fill={SERIES[i % SERIES.length]} />
      ))}
    </ScatterChart>
  )
}

export const DataChart = createComponentImplementation(DataChartApi, ({ props }) => {
  const all = (props.data ?? []) as Row[]
  const rows = all.slice(0, MAX_ROWS)
  const y = props.y ?? []
  const problem =
    !all.length ? 'No rows to chart.'
    : !props.x || !y.length ? 'The chart needs an x column and at least one y column.'
    : !all.some((r) => props.x in r) ? `No column named "${props.x}" in the data.`
    : y.find((k) => !all.some((r) => k in r)) ? `No column named "${y.find((k) => !all.some((r) => k in r))}" in the data.`
    : props.type === 'scatter' && (!numeric(rows, props.x) || !numeric(rows, y[0])) ? 'A scatter chart needs numeric x and y columns.'
    : y.find((k) => !numeric(rows, k)) ? `Column "${y.find((k) => !numeric(rows, k))}" is not numeric.`
    : null

  return (
    <Block title={props.title}>
      {problem ? (
        <p className="text-sm text-danger">{problem}</p>
      ) : (
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            {Plot({ type: props.type, rows, x: props.x, y, group: props.group, xLabel: props.xLabel, yLabel: props.yLabel })}
          </ResponsiveContainer>
        </div>
      )}
      {all.length > MAX_ROWS ? <Footnote>Showing the first {MAX_ROWS} of {all.length} rows.</Footnote> : null}
      {props.note ? <Footnote>{props.note}</Footnote> : null}
    </Block>
  )
})
