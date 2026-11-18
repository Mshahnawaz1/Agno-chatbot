# HTML template: resume / CV

Two-column on wide screens (sidebar: contact, skills; main: experience), one column on phones,
one A4/Letter page when printed. Use only facts the user gave; never invent employers, dates or
numbers. Save as `<firstname>-<lastname>-resume.html`.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jane Doe - Resume</title>
<style>
:root { --ink: #1b1f24; --muted: #4b5563; --line: #dde1e6; --accent: #0f5c4d; --bg: #ffffff; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.page { max-width: 880px; margin: 0 auto; padding: 36px 20px; display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 720px) { .page { grid-template-columns: 240px 1fr; } }
header { grid-column: 1 / -1; border-bottom: 2px solid var(--accent); padding-bottom: 12px; }
h1 { margin: 0; font-size: 2rem; line-height: 1.15; }
.role { margin: 4px 0 0; color: var(--accent); font-weight: 600; }
h2 { font-size: .85rem; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); margin: 0 0 8px; }
aside section, main section { margin-bottom: 20px; }
ul { margin: 0; padding-left: 18px; }
.plain { list-style: none; padding: 0; }
.plain li { margin-bottom: 4px; }
.job { margin-bottom: 16px; break-inside: avoid; }
.job h3 { margin: 0; font-size: 1rem; }
.when { color: var(--muted); font-size: .9rem; margin: 0 0 4px; }
a { color: var(--accent); }
@media print {
  body { font-size: 10.5pt; }
  .page { max-width: none; padding: 0; grid-template-columns: 200px 1fr; }
  a { color: inherit; text-decoration: none; }
}
</style>
</head>
<body>
<div class="page">
<header>
<h1>Jane Doe</h1>
<p class="role">Senior Product Designer</p>
</header>
<aside>
<section>
<h2>Contact</h2>
<ul class="plain">
<li>jane@example.com</li>
<li>Berlin, Germany</li>
</ul>
</section>
<section>
<h2>Skills</h2>
<ul class="plain">
<li>Design systems</li>
<li>User research</li>
</ul>
</section>
<section>
<h2>Education</h2>
<p>BA Interaction Design, UdK Berlin, 2016</p>
</section>
</aside>
<main>
<section>
<h2>Summary</h2>
<p>Product designer with 8 years in B2B SaaS, focused on design systems and onboarding.</p>
</section>
<section>
<h2>Experience</h2>
<article class="job">
<h3>Senior Product Designer, Acme</h3>
<p class="when">2021 - present · Berlin</p>
<ul>
<li>Led the design system used by 6 product teams; cut UI defects by 30%.</li>
<li>Redesigned onboarding, raising week-1 activation from 41% to 55%.</li>
</ul>
</article>
</section>
</main>
</div>
</body>
</html>
```
