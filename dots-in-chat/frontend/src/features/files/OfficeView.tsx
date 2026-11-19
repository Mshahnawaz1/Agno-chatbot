import { useEffect, useRef, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { DocViewer } from '@p10node/office-engine'
import * as api from '@/lib/api'
import { Spinner } from '@/components/ui'
import { fileName } from './fileRefs'

/** A .docx / .xlsx / .pptx drawn as the file is (layout, slides, sheets); edits are saved back to the file. */
export default function OfficeView({ path, version }: { path: string; version: string }) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const versionRef = useRef(version) // the file's version as last loaded or saved

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
  const save = async (file: Blob) => {
    try {
      const res = await api.saveFileBinary(path, file, versionRef.current)
      versionRef.current = res.version
      setSaveError(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save')
      throw err
    }
  }
  return (
    <div className="flex size-full flex-col">
      {saveError ? (
        <div role="alert" className="border-b border-danger/40 bg-danger/10 px-3 py-1.5 text-sm text-danger">
          Not saved: {saveError}
        </div>
      ) : null}
      <DocViewer src={blob} name={fileName(path)} theme="auto" allowOpen={false} comments={false} onSave={save} style={{ height: '100%', flex: 1, minHeight: 0 }} />
    </div>
  )
}
