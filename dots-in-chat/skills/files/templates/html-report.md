# HTML template: report / one-pager / brief

Document layout: title block, summary callout, sections, a table, key-figure row. Replace every
text node with real content; drop sections you don't need. Save as `<name>.html`.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Q3 Sales Report</title>
<style>
:root { --ink: #1c2430; --muted: #4a5565; --line: #d9dee5; --bg: #ffffff; --soft: #f3f6f9; --accent: #1f5fae; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 800px; margin: 0 auto; padding: 40px 20px 64px; }
header { border-bottom: 3px solid var(--accent); padding-bottom: 16px; margin-bottom: 24px; }
h1 { font-size: 2rem; line-height: 1.2; margin: 0 0 6px; }
h2 { font-size: 1.3rem; margin: 32px 0 8px; }
h3 { font-size: 1.05rem; margin: 20px 0 6px; }
.meta { color: var(--muted); margin: 0; font-size: .95rem; }
.summary { background: var(--soft); border-left: 4px solid var(--accent); padding: 14px 18px; margin: 0 0 8px; }
.figures { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 16px 0; }
.figure { border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; }
.figure b { display: block; font-size: 1.5rem; }
.figure span { color: var(--muted); font-size: .9rem; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; margin: 8px 0 16px; font-size: .95rem; }
th, td { border-bottom: 1px solid var(--line); padding: 8px 10px; text-align: left; vertical-align: top; }
th { background: var(--soft); }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
footer { margin-top: 40px; color: var(--muted); font-size: .85rem; border-top: 1px solid var(--line); padding-top: 12px; }
@media print {
  body { font-size: 11pt; }
  main { max-width: none; padding: 0; }
  .summary, th { background: none; }
  .figure, tr, .summary { break-inside: avoid; }
  h2, h3 { break-after: avoid; }
}
</style>
</head>
<body>
<main>
<header>
<h1>Q3 Sales Report</h1>
<p class="meta">Prepared for the leadership team · October 2026</p>
</header>
<p class="summary"><strong>Summary.</strong> Revenue grew 12% quarter on quarter, led by the EMEA region; churn rose slightly in SMB accounts.</p>
<section class="figures" aria-label="Key figures">
<div class="figure"><b>$4.2M</b><span>Revenue</span></div>
<div class="figure"><b>+12%</b><span>vs Q2</span></div>
<div class="figure"><b>3.1%</b><span>Churn</span></div>
</section>
<section>
<h2>Findings</h2>
<ul>
<li>EMEA closed three enterprise deals worth $900K combined.</li>
<li>SMB churn rose from 2.6% to 3.1% after the pricing change.</li>
</ul>
</section>
<section>
<h2>By region</h2>
<div class="table-wrap">
<table>
<thead><tr><th>Region</th><th class="num">Revenue</th><th class="num">Change</th></tr></thead>
<tbody>
<tr><td>EMEA</td><td class="num">$1.8M</td><td class="num">+21%</td></tr>
<tr><td>Americas</td><td class="num">$1.7M</td><td class="num">+6%</td></tr>
</tbody>
</table>
</div>
</section>
<section>
<h2>Recommendations</h2>
<ol>
<li>Offer SMB accounts an annual plan at the old price.</li>
</ol>
</section>
<footer>Source: CRM export, 1 Oct 2026.</footer>
</main>
</body>
</html>
```
