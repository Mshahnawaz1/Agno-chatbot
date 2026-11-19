import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'
import type { FileEntry } from '@/lib/types'

/** What the composer holds for a message: workspace files, uploaded now or picked from artifacts. */
export type Attached = Pick<FileEntry, 'path' | 'name' | 'kind'>

export const MAX_ATTACHMENTS = 10

export function useAttachments() {
  const queryClient = useQueryClient()
  const [attached, setAttached] = useState<Attached[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = useCallback((entries: Attached[]) => {
    setAttached((cur) => {
      const seen = new Set(cur.map((a) => a.path))
      const next = [...cur, ...entries.filter((e) => !seen.has(e.path)).map(({ path, name, kind }) => ({ path, name, kind }))]
      return next.slice(0, MAX_ATTACHMENTS)
    })
  }, [])

  /** Saves the files into the workspace (shown in Artifacts too), then attaches them. */
  const upload = useCallback(
    async (files: File[]) => {
      if (!files.length) return
      setError(null)
      setUploading(true)
      try {
        add(await api.uploadFiles(files))
        void queryClient.invalidateQueries({ queryKey: ['files'] })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [add, queryClient],
  )

  const remove = useCallback((path: string) => setAttached((cur) => cur.filter((a) => a.path !== path)), [])
  const clear = useCallback(() => {
    setAttached([])
    setError(null)
  }, [])

  return { attached, uploading, error, add, upload, remove, clear }
}
