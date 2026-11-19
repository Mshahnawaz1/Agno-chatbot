import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'
import type { FileEntry } from '@/lib/types'
import { KIND_ICON } from './kinds'
import { pageDoc } from './pageDoc'

const OfficeView = lazy(() => import('./OfficeView'))

/** The page is laid out at this size, then scaled down to the card's width. */
const PAGE_W = 800
const PAGE_H = 1000

function useVisible() {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: '200px' })
    io.observe(el)
    return () => {
      ro.disconnect()
      io.disconnect()
    }
  }, [])
  return { ref, seen, width }
}

function PdfPage({ path }: { path: string }) {
  const blob = useQuery({
    queryKey: ['file-thumb-blob', path],
    queryFn: ({ signal }) => api.fetchFileBlob(path, signal),
    staleTime: 60_000,
    gcTime: 60_000,
  })
  const url = useMemo(() => (blob.data ? URL.createObjectURL(new Blob([blob.data], { type: 'application/pdf' })) : null), [blob.data])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  if (!url) return null
  return <iframe title="" tabIndex={-1} src={`${url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="block size-full border-0 bg-white" />
}

function Page({ file }: { file: FileEntry }) {
  const q = useQuery({
    queryKey: ['file-thumb', file.path, file.modified],
    queryFn: () => api.getFilePreview(file.path),
    staleTime: Infinity,
    retry: false,
  })
  if (!q.data) return null
  const { kind, html } = q.data
  const raw = q.data.file ?? file.path
  if (kind === 'pdf') return <PdfPage path={raw} />
  if (kind === 'docx' || kind === 'xlsx' || kind === 'csv' || kind === 'pptx') {
    return (
      <Suspense fallback={null}>
        <OfficeView path={raw} />
      </Suspense>
    )
  }
  return (
    <iframe
      title=""
      tabIndex={-1}
      sandbox=""
      srcDoc={kind === 'html' ? html : pageDoc(html)}
      className="block size-full border-0 bg-white"
    />
  )
}

/** The first page of a file, drawn small and not interactive; the kind's icon shows until it is ready. */
export function FileThumb({ file }: { file: FileEntry }) {
  const { ref, seen, width } = useVisible()
  const Icon = KIND_ICON[file.kind]
  const scale = width / PAGE_W
  const [ready, setReady] = useState(false)
  useEffect(() => {
    // Give the page a moment to paint before the icon is hidden.
    if (!seen) return
    const t = setTimeout(() => setReady(true), 600)
    return () => clearTimeout(t)
  }, [seen])
  const frame: ReactNode =
    seen && width > 0 ? (
      <div
        aria-hidden
        inert
        className="pointer-events-none absolute left-0 top-0 origin-top-left overflow-hidden bg-white"
        style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})` }}
      >
        <Page file={file} />
      </div>
    ) : null
  return (
    <div ref={ref} className="relative h-44 w-full overflow-hidden bg-surface-2">
      <Icon className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-accent" strokeWidth={1.5} aria-hidden />
      <div className={ready ? 'absolute inset-0' : 'absolute inset-0 opacity-0'}>{frame}</div>
    </div>
  )
}
