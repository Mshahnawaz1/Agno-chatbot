import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'

export type FilePanelValue = {
  /** Path shown in the panel; null = closed. */
  path: string | null
  /** Bumps when the agent changes a file, so the preview refetches. */
  rev: number
  open: (path: string) => void
  close: () => void
  /** The agent changed a file: refetch, and show `path` when `show`. */
  touch: (path: string | null, show: boolean) => void
}

export const FilePanelContext = createContext<FilePanelValue>({
  path: null,
  rev: 0,
  open: () => {},
  close: () => {},
  touch: () => {},
})

export const useFilePanelContext = () => useContext(FilePanelContext)

export function useFilePanelState(): FilePanelValue {
  const [state, setState] = useState<{ path: string | null; rev: number }>({ path: null, rev: 0 })
  const open = useCallback((path: string) => setState((s) => ({ ...s, path })), [])
  const close = useCallback(() => setState((s) => (s.path === null ? s : { ...s, path: null })), [])
  const touch = useCallback(
    (path: string | null, show: boolean) =>
      setState((s) => ({ path: show && path ? path : s.path, rev: s.rev + 1 })),
    [],
  )
  return useMemo(() => ({ ...state, open, close, touch }), [state, open, close, touch])
}

/** The rendered preview of one file; keyed by path and revision so edits refetch. */
export function useFilePreview(path: string, rev: number) {
  return useQuery({
    queryKey: ['file-preview', path, rev],
    queryFn: () => api.getFilePreview(path),
    staleTime: Infinity,
    retry: (count, err) => !(err instanceof api.ApiError && err.status < 500) && count < 2,
  })
}
