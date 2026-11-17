# Choosing the right chart (read before drawing any chart)

A wrong chart misleads. Decide in this order, then draw.

## 1. Data
- Use only numbers the user gave, a tool returned, or you computed from those. Never invent
  or "illustrate" values. If a number is missing, ask in a form (components.md, form.md).
- Say what the numbers are (units, currency, period) in the title or axis, e.g. "Rupees per month".

## 2. Pick by the question the chart answers
| The user wants to see | Draw | Not |
|---|---|---|
| how one income/total splits into parts (budget, expenses by category) | BudgetSplit (draggable ring), or ChartSwitcher with partsOfWhole=true | bar of unrelated numbers |
| categories compared (spending by category, sales by product) | bar, sorted largest first, horizontal if labels are long | line, area |
| a change over time (monthly sales, a balance) | line (area if it is a running total) | pie, bar of 40 dates |
| parts of ONE whole, 2-6 slices that add up | pie / donut | pie of ratings, temperatures, prices, or negatives |
| how values are spread (marks, ages) | histogram | bar of raw rows |
| two numbers related (hours vs score) | scatter | line between unordered points |
| one value against a target | gauge (ChartGallery) | pie |
| start, then ups and downs, then end | waterfall (ChartGallery) | stacked bar |

If the user names a chart type that would mislead (a pie of values that are not parts of a
whole, a line through categories), draw the honest one and say why in one short sentence.
If they name a fine type, draw exactly that. ChartSwitcher shows another style when the one you
pass is greyed for this data (e.g. `style="pie"` with partsOfWhole=false shows a bar chart), so
pass the honest style yourself and name what is shown: "A pie would mislead here (temperatures
are not parts of a whole), so this is a bar chart." Never write "here is the pie chart" then.

## 3. Pick the tool
- One series, up to ~12 points: ChartSwitcher (block-charts.md). ALWAYS pass both flags:
  `partsOfWhole=true` only when the values add up to a meaningful total, otherwise false;
  `ordered=false` for categories (rent, food, travel), `ordered=true` only for time or a
  natural sequence. `ordered` defaults to true, so leaving it out turns on line/area for
  categories. Put the type the user asked for in `style`.
- Types ChartSwitcher lacks (scatter, histogram, gauge, waterfall, heatmap, radar): ChartGallery
  when the user wants options, otherwise VegaChart.
- More than 12 points, several series, or a custom formula: VegaChart (chart.md).

## 4. VegaChart rules
- Copy the matching recipe below and change only its data, titles and labels. Do not invent
  Vega-Lite keys (there is no `"coordinates": "polar"` and no `closed` mark option): the server
  checks every spec against the Vega-Lite schema and rejects a spec with an unknown key.
- Radar, gauge, heatmap and waterfall have recipes below; ChartGallery lists the same types.
- Bars start at zero. Never truncate an axis to exaggerate a difference.
- One y axis; no dual axes. More than 12 categories: show the top 10 and group the rest as "Other".
- Always set axis `title`s with units; add a `tooltip`. Keep inline `values`; no URLs.
- Dates: `"type": "temporal"` with ISO dates ("2026-01-01"); months or names: `"ordinal"` with
  `"sort": null` to keep your order.

Bar (categories, sorted, horizontal):
`{"data": {"values": [{"c": "Rent", "v": 30000}, {"c": "Food", "v": 20000}]}, "mark": "bar", "encoding": {"y": {"field": "c", "type": "nominal", "sort": "-x", "title": null}, "x": {"field": "v", "type": "quantitative", "title": "Rupees per month"}, "tooltip": [{"field": "c"}, {"field": "v", "format": ",.0f"}]}}`

Line over time:
`{"data": {"values": [{"m": "2026-01-01", "v": 10}, {"m": "2026-02-01", "v": 14}]}, "mark": {"type": "line", "point": true}, "encoding": {"x": {"field": "m", "type": "temporal", "title": "Month"}, "y": {"field": "v", "type": "quantitative", "title": "Sales"}}}`

Donut (parts of one whole):
`{"data": {"values": [{"c": "Rent", "v": 30}, {"c": "Food", "v": 20}]}, "mark": {"type": "arc", "innerRadius": 60}, "encoding": {"theta": {"field": "v", "type": "quantitative"}, "color": {"field": "c", "type": "nominal"}, "tooltip": [{"field": "c"}, {"field": "v"}]}}`

Stacked bar over months:
`{"data": {"values": [{"m": "Jan", "c": "Rent", "v": 1}, {"m": "Jan", "c": "Food", "v": 2}]}, "mark": "bar", "encoding": {"x": {"field": "m", "type": "ordinal", "sort": null, "title": "Month"}, "y": {"field": "v", "type": "quantitative", "title": "Rupees"}, "color": {"field": "c", "type": "nominal"}}}`

Scatter:
`{"data": {"values": [{"x": 1, "y": 2}, {"x": 2, "y": 3}]}, "mark": "point", "encoding": {"x": {"field": "x", "type": "quantitative", "title": "Hours studied"}, "y": {"field": "y", "type": "quantitative", "title": "Score"}}}`

Histogram:
`{"data": {"values": [{"v": 1}, {"v": 2}, {"v": 2}]}, "mark": "bar", "encoding": {"x": {"field": "v", "bin": true, "type": "quantitative", "title": "Marks"}, "y": {"aggregate": "count", "title": "Students"}}}`

Radar (one polygon over n axes; set the param n to the number of axes and 100 to the scale's maximum):
`{"width": 300, "height": 300, "params": [{"name": "n", "value": 6}], "data": {"values": [{"k": "Cardio", "v": 85}, {"k": "Strength", "v": 75}, {"k": "Mental", "v": 90}, {"k": "Stamina", "v": 80}, {"k": "Flexibility", "v": 70}, {"k": "Recovery", "v": 88}]}, "transform": [{"window": [{"op": "row_number", "as": "i"}]}, {"calculate": "(datum.i - 1) / n * 2 * PI", "as": "a"}, {"calculate": "0", "as": "o"}, {"calculate": "datum.v / 100 * sin(datum.a)", "as": "x"}, {"calculate": "datum.v / 100 * cos(datum.a)", "as": "y"}, {"calculate": "sin(datum.a)", "as": "ex"}, {"calculate": "cos(datum.a)", "as": "ey"}, {"calculate": "1.18 * sin(datum.a)", "as": "lx"}, {"calculate": "1.18 * cos(datum.a)", "as": "ly"}], "layer": [{"data": {"values": [{"r": 0.25}, {"r": 0.5}, {"r": 0.75}, {"r": 1}]}, "transform": [{"calculate": "sequence(0, n + 1)", "as": "j"}, {"flatten": ["j"]}, {"calculate": "datum.r * sin(datum.j / n * 2 * PI)", "as": "x"}, {"calculate": "datum.r * cos(datum.j / n * 2 * PI)", "as": "y"}], "mark": {"type": "line", "color": "#666", "strokeWidth": 1}, "encoding": {"x": {"field": "x", "type": "quantitative", "scale": {"domain": [-1.45, 1.45]}, "axis": null}, "y": {"field": "y", "type": "quantitative", "scale": {"domain": [-1.45, 1.45]}, "axis": null}, "detail": {"field": "r"}, "order": {"field": "j"}}}, {"mark": {"type": "rule", "color": "#666", "strokeWidth": 1}, "encoding": {"x": {"field": "o", "type": "quantitative"}, "y": {"field": "o", "type": "quantitative"}, "x2": {"field": "ex"}, "y2": {"field": "ey"}}}, {"mark": {"type": "line", "interpolate": "linear-closed", "point": true, "color": "#10a37f"}, "encoding": {"x": {"field": "x", "type": "quantitative"}, "y": {"field": "y", "type": "quantitative"}, "order": {"field": "i"}, "tooltip": [{"field": "k", "title": "Axis"}, {"field": "v", "title": "Score"}]}}, {"mark": {"type": "text", "fontSize": 12}, "encoding": {"x": {"field": "lx", "type": "quantitative"}, "y": {"field": "ly", "type": "quantitative"}, "text": {"field": "k"}}}]}`

Gauge (one value of a 0-100 scale; change 72 and the label):
`{"width": 300, "height": 170, "view": {"stroke": null}, "layer": [{"data": {"values": [{"v": 100}]}, "transform": [{"calculate": "-PI / 2", "as": "t1"}, {"calculate": "-PI / 2 + datum.v / 100 * PI", "as": "t2"}], "mark": {"type": "arc", "innerRadius": 85, "outerRadius": 120, "color": "#333"}, "encoding": {"theta": {"field": "t1", "type": "quantitative", "scale": null}, "theta2": {"field": "t2"}}}, {"data": {"values": [{"v": 72}]}, "transform": [{"calculate": "-PI / 2", "as": "t1"}, {"calculate": "-PI / 2 + datum.v / 100 * PI", "as": "t2"}], "mark": {"type": "arc", "innerRadius": 85, "outerRadius": 120, "color": "#10a37f"}, "encoding": {"theta": {"field": "t1", "type": "quantitative", "scale": null}, "theta2": {"field": "t2"}}}, {"data": {"values": [{"t": "72%"}]}, "mark": {"type": "text", "fontSize": 30, "dy": -8}, "encoding": {"text": {"field": "t"}}}]}`

Heatmap (two categories and a number):
`{"data": {"values": [{"day": "Mon", "slot": "AM", "n": 3}, {"day": "Mon", "slot": "PM", "n": 7}, {"day": "Tue", "slot": "AM", "n": 5}, {"day": "Tue", "slot": "PM", "n": 2}]}, "mark": "rect", "encoding": {"x": {"field": "day", "type": "ordinal", "sort": null, "title": null}, "y": {"field": "slot", "type": "ordinal", "title": null}, "color": {"field": "n", "type": "quantitative", "title": "Count"}, "tooltip": [{"field": "day"}, {"field": "slot"}, {"field": "n"}]}}`

Waterfall (start, ups and downs, end; amounts are changes, the last row is the total):
`{"data": {"values": [{"s": "Start", "a": 100}, {"s": "Sales", "a": 40}, {"s": "Costs", "a": -30}, {"s": "Tax", "a": -10}]}, "transform": [{"window": [{"op": "sum", "field": "a", "as": "end"}], "frame": [null, 0]}, {"calculate": "datum.end - datum.a", "as": "start"}], "layer": [{"mark": "bar", "encoding": {"x": {"field": "s", "type": "ordinal", "sort": null, "title": null}, "y": {"field": "start", "type": "quantitative", "title": "Rupees"}, "y2": {"field": "end"}, "color": {"condition": {"test": "datum.a < 0", "value": "#f87171"}, "value": "#10a37f"}, "tooltip": [{"field": "s"}, {"field": "a"}, {"field": "end", "title": "Running total"}]}}]}`

Area over time:
`{"data": {"values": [{"m": "2026-01-01", "v": 10}, {"m": "2026-02-01", "v": 14}, {"m": "2026-03-01", "v": 13}]}, "mark": {"type": "area", "line": true, "opacity": 0.4}, "encoding": {"x": {"field": "m", "type": "temporal", "title": "Month"}, "y": {"field": "v", "type": "quantitative", "title": "Balance"}}}`

Use one as `chart = VegaChart(<spec>, 300)` inside `root = Card(Column([title, chart]))`.
