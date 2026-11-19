/** The paper stays light in both themes: it stands for the printed page. */
const PAGE_CSS = `
:root{color-scheme:light}
*{box-sizing:border-box}
html{background:#e7e7ec}
body{margin:0;padding:24px 16px;font:15px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1c1c22}
.page{max-width:760px;margin:0 auto;background:#fff;padding:48px 56px;min-height:calc(100vh - 48px);box-shadow:0 1px 3px rgba(0,0,0,.18);overflow-wrap:anywhere}
h1,h2,h3,h4{line-height:1.25;margin:1.4em 0 .5em;color:#111}
h1{font-size:1.9em;margin-top:0}h2{font-size:1.45em}h3{font-size:1.2em}
p{margin:0 0 .9em}ul,ol{margin:0 0 .9em;padding-left:1.5em}
a{color:#4c1d95}
blockquote{margin:0 0 .9em;padding-left:1em;border-left:3px solid #c9c9d3;color:#555}
code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.92em;background:#f0f0f4;padding:.1em .3em;border-radius:3px}
table{border-collapse:collapse;display:block;max-width:100%;overflow-x:auto;margin:0 0 1em;font-size:.95em}
th,td{border:1px solid #cfcfd8;padding:6px 10px;text-align:left;vertical-align:top}
th{background:#f3f3f7}
img{max-width:100%;height:auto}
@media(max-width:520px){.page{padding:28px 20px}}
`

export function pageDoc(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${PAGE_CSS}</style></head><body><div class="page">${html}</div></body></html>`
}

