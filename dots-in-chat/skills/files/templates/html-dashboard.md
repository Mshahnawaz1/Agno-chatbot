# HTML template: dashboard page (KPI cards + inline SVG chart)

A static snapshot page: KPI cards, a bar chart drawn as inline SVG, a status table. No scripts,
so every value and bar is computed by you when writing the file. For a live card inside the
chat, use the ui-display skill instead. Save as `<name>-dashboard.html`.

Bar chart math: chart area 0..100 units tall; each bar height = value / max * 90, y = 100 - height.
Write the value as a text label too (color is never the only signal).

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Support Dashboard - Week 46</title>
<style>
:root { --ink: #18202b; --muted: #4d5866; --line: #dfe3e8; --bg: #f5f7fa; --card: #ffffff; --accent: #2457c5; --good: #146c43; --bad: #b42318; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 1100px; margin: 0 auto; padding: 28px 16px 48px; }
h1 { margin: 0 0 4px; font-size: 1.6rem; }
.meta { margin: 0 0 20px; color: var(--muted); }
h2 { font-size: 1rem; margin: 0 0 10px; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; break-inside: avoid; }
.kpi-label { color: var(--muted); font-size: .85rem; margin: 0; }
.kpi-value { font-size: 1.8rem; font-weight: 700; margin: 2px 0; font-variant-numeric: tabular-nums; }
.up { color: var(--good); font-size: .85rem; margin: 0; }
.down { color: var(--bad); font-size: .85rem; margin: 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; }
svg { width: 100%; height: auto; display: block; }
.bar { fill: var(--accent); }
.axis { stroke: var(--line); }
.lbl { font-size: 4px; fill: var(--muted); text-anchor: middle; }
.val { font-size: 4px; fill: var(--ink); text-anchor: middle; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: .92rem; }
th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid var(--line); }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
@media print {
  body { background: #fff; }
  main { max-width: none; padding: 0; }
  .card { border-color: #999; }
}
</style>
</head>
<body>
<main>
<h1>Support Dashboard</h1>
<p class="meta">Week 46 · 10-16 Nov 2026</p>
<section class="kpis" aria-label="Key metrics">
<div class="card"><p class="kpi-label">Tickets</p><p class="kpi-value">1,284</p><p class="down">▲ 8% vs last week</p></div>
<div class="card"><p class="kpi-label">Median first reply</p><p class="kpi-value">42 min</p><p class="up">▼ 11 min</p></div>
<div class="card"><p class="kpi-label">CSAT</p><p class="kpi-value">94%</p><p class="up">▲ 1 pt</p></div>
</section>
<div class="grid">
<section class="card">
<h2>Tickets per day</h2>
<svg viewBox="0 0 120 110" role="img" aria-labelledby="t1">
<title id="t1">Tickets per day, Monday to Friday: 220, 260, 198, 240, 180</title>
<line class="axis" x1="0" y1="100" x2="120" y2="100"/>
<rect class="bar" x="6" y="23.9" width="16" height="76.1"/><text class="val" x="14" y="21">220</text><text class="lbl" x="14" y="106">Mon</text>
<rect class="bar" x="29" y="10" width="16" height="90"/><text class="val" x="37" y="7">260</text><text class="lbl" x="37" y="106">Tue</text>
<rect class="bar" x="52" y="31.5" width="16" height="68.5"/><text class="val" x="60" y="28.5">198</text><text class="lbl" x="60" y="106">Wed</text>
<rect class="bar" x="75" y="16.9" width="16" height="83.1"/><text class="val" x="83" y="14">240</text><text class="lbl" x="83" y="106">Thu</text>
<rect class="bar" x="98" y="37.7" width="16" height="62.3"/><text class="val" x="106" y="34.7">180</text><text class="lbl" x="106" y="106">Fri</text>
</svg>
</section>
<section class="card">
<h2>Open escalations</h2>
<div class="table-wrap">
<table>
<thead><tr><th>Account</th><th>Issue</th><th>Age</th></tr></thead>
<tbody>
<tr><td>Northwind</td><td>SSO login loop</td><td class="num">3 d</td></tr>
<tr><td>Contoso</td><td>Export timeout</td><td class="num">1 d</td></tr>
</tbody>
</table>
</div>
</section>
</div>
</main>
</body>
</html>
```
