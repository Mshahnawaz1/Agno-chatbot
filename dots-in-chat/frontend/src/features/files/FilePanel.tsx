import { lazy, Suspense, useEffect, useState } from 'react'
import { ArrowLeft, CircleAlert, Download, FileX, X } from 'lucide-react'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import { Button, IconButton, Spinner } from '@/components/ui'
import { fileName } from './fileRefs'
import { MdView } from './MdView'
import { useFilePanelContext, useFilePreview } from './useFilePanel'
import { VersionHistory } from './VersionHistory'

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

function pageDoc(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${PAGE_CSS}</style></head><body><div class="page">${html}</div></body></html>`
}

type PdfState = { status: 'loading' } | { status: 'ready'; url: string } | { status: 'gone' } | { status: 'error'; message: string }

/** The real PDF: fetched with auth, shown from an object URL (unsandboxed; Chrome's viewer needs it). */
function PdfView({ path }: { path: string }) {
  const [state, setState] = useState<PdfState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    let url: string | null = null
    api
      .fetchFileBlob(path, ctrl.signal)
      .then((blob) => {
        url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
        setState({ status: 'ready', url })
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return
        if (err instanceof ApiError && err.status === 404) setState({ status: 'gone' })
        else setState({ status: 'error', message: err instanceof Error ? err.message : 'Download failed' })
      })
    return () => {
      ctrl.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [path, attempt])

  if (state.status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-fg-muted">
        <Spinner label="Loading PDF" /> Loading PDF…
      </div>
    )
  }
  if (state.status === 'gone' || state.status === 'error') {
    const gone = state.status === 'gone'
    const Icon = gone ? FileX : CircleAlert
    return (
      <div role={gone ? 'status' : 'alert'} className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Icon className={gone ? 'size-8 text-fg-subtle' : 'size-8 text-danger'} aria-hidden />
        <p className="font-medium text-fg">{gone ? 'This file was deleted' : 'Could not load the PDF'}</p>
        <p className="max-w-xs text-sm text-fg-muted">
          {gone ? 'It no longer exists in your workspace.' : state.message}
        </p>
        {!gone ? (
          <Button size="sm" variant="secondary" onClick={() => {
              setState({ status: 'loading' })
              setAttempt((n) => n + 1)
            }}>
            Try again
          </Button>
        ) : null}
      </div>
    )
  }
  return <iframe title={`Preview of ${fileName(path)}`} src={state.url} className="block size-full border-0 bg-white" />
}

const OfficeView = lazy(() => import('./OfficeView'))

function PanelBody({ path }: { path: string }) {
  const { rev } = useFilePanelContext()
  const q = useFilePreview(path, rev)

  if (q.isPending) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-fg-muted">
        <Spinner label="Loading preview" /> Loading preview…
      </div>
    )
  }
  if (q.isError) {
    const gone = q.error instanceof ApiError && q.error.status === 404
    const Icon = gone ? FileX : CircleAlert
    return (
      <div role={gone ? 'status' : 'alert'} className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Icon className={gone ? 'size-8 text-fg-subtle' : 'size-8 text-danger'} aria-hidden />
        <p className="font-medium text-fg">{gone ? 'This file was deleted' : 'Could not load the preview'}</p>
        <p className="max-w-xs text-sm text-fg-muted">
          {gone ? 'It no longer exists in your workspace.' : q.error.message}
        </p>
        {!gone ? (
          <Button size="sm" variant="secondary" onClick={() => void q.refetch()}>
            Try again
          </Button>
        ) : null}
      </div>
    )
  }
  // Markdown is drawn in the page (not an iframe): selections have to be readable to offer AI edits.
  if (q.data.kind === 'md' && q.data.source !== undefined) {
    return <MdView key={path} path={path} source={q.data.source} version={q.data.version} />
  }
  const file = q.data.file ?? path
  if (q.data.kind === 'pdf') return <PdfView key={`${file}:${q.data.version}`} path={file} />
  if (q.data.kind === 'docx' || q.data.kind === 'xlsx' || q.data.kind === 'csv' || q.data.kind === 'pptx') {
    return (
      <Suspense fallback={<div className="flex h-full items-center justify-center gap-2 text-sm text-fg-muted"><Spinner label="Loading viewer" /> Loading viewer…</div>}>
        <OfficeView key={`${file}:${q.data.version}`} path={file} />
      </Suspense>
    )
  }
  // html: the server's full document (CSP already injected), shown as is; docx/md: paper wrapper.
  const doc = q.data.kind === 'html' ? q.data.html : pageDoc(q.data.html)
  return (
    <iframe
      key={q.data.version}
      title={`Preview of ${fileName(path)}`}
      sandbox=""
      srcDoc={doc}
      className={`block size-full border-0 ${q.data.kind === 'html' ? 'bg-white' : 'bg-[#e7e7ec]'}`}
    />
  )
}

/** Right-hand preview of a workspace file; a full-screen overlay below `lg`. */
export function FilePanel({ path }: { path: string }) {
  const { close } = useFilePanelContext()
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const ext = path.toLowerCase().split('.').pop()

  async function download() {
    setDownloading(true)
    setDownloadError(null)
    try {
      await api.downloadFile(path)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <aside
      aria-label="File preview"
      className="fixed inset-0 z-40 flex flex-col bg-bg lg:static lg:z-auto lg:w-[45%] lg:shrink-0 lg:border-l lg:border-white/10"
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 px-3">
        <IconButton aria-label="Back to chat" size="sm" onClick={close} className="lg:hidden">
          <ArrowLeft className="size-4" aria-hidden />
        </IconButton>
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-fg" title={path}>
          {fileName(path)}
        </h2>
        <VersionHistory path={path} />
        <Button size="sm" variant="secondary" onClick={() => void download()} loading={downloading}>
          <Download className="size-4" aria-hidden />
          {ext ? `Download .${ext}` : 'Download'}
        </Button>
        <IconButton aria-label="Close preview" size="sm" onClick={close} className="max-lg:hidden">
          <X className="size-4" aria-hidden />
        </IconButton>
      </header>
      {downloadError ? (
        <p role="alert" className="border-b border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">
          {downloadError}
        </p>
      ) : null}
      <div className="min-h-0 flex-1">
        <PanelBody path={path} />
      </div>
    </aside>
  )
}
