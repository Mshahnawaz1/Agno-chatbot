import { useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { DocViewer } from '@p10node/office-engine'
import * as api from '@/lib/api'
import { Spinner } from '@/components/ui'
import { fileName } from './fileRefs'

/** A .docx / .xlsx / .pptx drawn as the file is (layout, slides, sheets), view only. */
export default function OfficeView({ path }: { path: string }) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    api
      .fetchFileBlob(path, ctrl.signal)
      .then(setBlob)
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : 'Download failed')
      })
    return () => ctrl.abort()
  }, [path])

  if (error) {
    return (
      <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <CircleAlert className="size-8 text-danger" aria-hidden />
        <p className="font-medium text-fg">Could not load the file</p>
        <p className="max-w-xs text-sm text-fg-muted">{error}</p>
      </div>
    )
  }
  if (!blob) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-fg-muted">
        <Spinner label="Loading file" /> Loading file…
      </div>
    )
  }
  return <DocViewer src={blob} name={fileName(path)} theme="auto" allowEdit={false} allowSave={false} allowOpen={false} comments={false} style={{ height: '100%' }} />
}
