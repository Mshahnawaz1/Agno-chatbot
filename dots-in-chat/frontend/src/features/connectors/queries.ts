import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  authorizeConnector,
  disconnectConnector,
  getConnectorSkill,
  listConnectors,
  setConnectorKey,
  updateConnector,
} from '@/lib/api'

export function useConnectors() {
  return useQuery({ queryKey: ['connectors'], queryFn: listConnectors })
}

export function useSkill(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['skill', id],
    queryFn: () => getConnectorSkill(id),
    enabled,
  })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['connectors'] })
}

export function useToggleConnector() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateConnector(id, { enabled }),
    onSuccess: invalidate,
  })
}

export function useSaveApiKey() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, apiKey }: { id: string; apiKey: string }) => setConnectorKey(id, apiKey),
    onSuccess: invalidate,
  })
}

export function useDisconnect() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => disconnectConnector(id),
    onSuccess: invalidate,
  })
}

/** Starts the connect flow: redirects for OAuth, or calls onNeedsApiKey for key-based servers. */
export function useConnect(onNeedsApiKey: (id: string) => void) {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authorizeConnector(id)
      if ('url' in res) {
        window.location.href = res.url
      } else {
        onNeedsApiKey(id)
      }
    },
  })
}
