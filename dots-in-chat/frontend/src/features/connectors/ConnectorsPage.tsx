import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router'
import { AlertTriangle, CheckCircle2, Search, X } from 'lucide-react'
import clsx from 'clsx'
import { Badge, Button, IconButton, Input } from '@/components/ui'
import type { Connector } from '@/lib/types'
import { ApiKeyDialog } from './ApiKeyDialog'
import { ConnectorCard } from './ConnectorCard'
import { ConnectorDetailDialog } from './ConnectorDetailDialog'
import { getConnectorMeta } from './connectorMeta'
import { useConnect, useConnectors } from './queries'
import { SkillDialog } from './SkillDialog'

type Tab = 'all' | 'connected'
type Banner = { kind: 'success' | 'danger'; id: string }

export function ConnectorsPage() {
  const { data, isPending, error, refetch } = useConnectors()
  const [params, setParams] = useSearchParams()
  // The OAuth redirect lands here with ?connected / ?connector_error on a full page load,
  // so capturing it once on mount is enough; the effect below then cleans the URL.
  const [banner, setBanner] = useState<Banner | null>(() => {
    const ok = params.get('connected')
    const bad = params.get('connector_error')
    if (ok) return { kind: 'success', id: ok }
    if (bad) return { kind: 'danger', id: bad }
    return null
  })
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [keyId, setKeyId] = useState<string | null>(null)
  const [skillId, setSkillId] = useState<string | null>(null)
  const [cardError, setCardError] = useState<string | null>(null)
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ all: null, connected: null })

  const okId = params.get('connected')
  const badId = params.get('connector_error')
  useEffect(() => {
    if (!okId && !badId) return
    const next = new URLSearchParams(params)
    next.delete('connected')
    next.delete('connector_error')
    setParams(next, { replace: true })
  }, [okId, badId, params, setParams])

  const connect = useConnect((id) => setKeyId(id))
  // Used by the detail dialog; rejects on failure so it can show an inline error.
  const startConnect = (id: string) => connect.mutateAsync(id)

  const list = useMemo(() => data ?? [], [data])
  const byId = (id: string | null): Connector | null => list.find((c) => c.id === id) ?? null
  const connectedCount = list.filter((c) => c.connected).length

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return list.filter((c) => {
      if (tab === 'connected' && !c.connected) return false
      if (!q) return true
      const provider = getConnectorMeta(c.id, c.name).provider
      return [c.name, c.notes, provider].some((s) => s.toLowerCase().includes(q))
    })
  }, [list, query, tab])

  function bannerName(id: string) {
    return list.find((c) => c.id === id)?.name ?? id
  }

  function onTabKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const next: Tab = e.key === 'ArrowLeft' || e.key === 'Home' ? 'all' : 'connected'
    setTab(next)
    tabRefs.current[next]?.focus()
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: list.length },
    { id: 'connected', label: 'Connected', count: connectedCount },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-display text-4xl text-fg sm:text-5xl">Connectors</h1>
            {data && <Badge aria-label={`${list.length} connectors`}>{list.length}</Badge>}
          </div>
          <p className="text-fg-muted">
            Connect the tools you use so the assistant can read and act in them on your behalf.
          </p>
        </header>

        {banner && (
          <div
            role={banner.kind === 'danger' ? 'alert' : 'status'}
            className={clsx(
              'mt-6 flex items-start gap-3 rounded-md border px-4 py-3 text-sm',
              banner.kind === 'success'
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-danger/30 bg-danger/10 text-danger',
            )}
          >
            {banner.kind === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <p className="min-w-0 flex-1">
              {banner.kind === 'success'
                ? `${bannerName(banner.id)} connected.`
                : `Could not connect ${bannerName(banner.id)}. Please try again.`}
            </p>
            <IconButton aria-label="Dismiss" size="sm" tooltip={false} onClick={() => setBanner(null)} className="-my-1 text-current">
              <X className="size-4" aria-hidden />
            </IconButton>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Filter connectors"
            onKeyDown={onTabKey}
            className="inline-flex self-start rounded-full border border-border bg-surface p-1"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el
                }}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'inline-flex h-8 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors',
                  tab === t.id ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg',
                )}
              >
                {t.label}
                <span className="text-xs text-fg-subtle">{t.count}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
            <Input
              type="search"
              aria-label="Search connectors"
              placeholder="Search connectors"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {cardError && (
          <p role="alert" className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {cardError}
          </p>
        )}

        <div role="tabpanel" className="mt-6">
          {isPending ? (
            <ul className="grid gap-4 min-[900px]:grid-cols-2" aria-busy="true" aria-label="Loading connectors">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="flex h-[124px] animate-pulse items-start gap-4 rounded-lg bg-surface p-5">
                  <div className="size-14 rounded-md bg-surface-3" />
                  <div className="flex flex-1 flex-col gap-2 pt-1">
                    <div className="h-4 w-1/3 rounded-sm bg-surface-3" />
                    <div className="h-3 w-full rounded-sm bg-surface-2" />
                    <div className="h-3 w-1/2 rounded-sm bg-surface-2" />
                  </div>
                </li>
              ))}
            </ul>
          ) : error ? (
            <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-5 text-sm text-danger">
              <p>Could not load connectors: {error.message}</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-fg-muted">
              {query.trim()
                ? `No connectors match "${query.trim()}".`
                : tab === 'connected'
                  ? 'Nothing connected yet. Pick a connector from All to get started.'
                  : 'No connectors available.'}
            </div>
          ) : (
            <ul className="grid gap-4 min-[900px]:grid-cols-2">
              {visible.map((c) => (
                <ConnectorCard
                  key={c.id}
                  connector={c}
                  connecting={connect.isPending && connect.variables === c.id}
                  onOpen={() => setDetailId(c.id)}
                  onConnect={() => {
                    setCardError(null)
                    connect.mutate(c.id, {
                      onError: (e) => setCardError(`Could not connect ${c.name}: ${e.message}`),
                    })
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConnectorDetailDialog
        connector={byId(detailId)}
        onClose={() => setDetailId(null)}
        onConnect={startConnect}
        onViewSkill={(c) => setSkillId(c.id)}
      />
      <SkillDialog connector={byId(skillId)} onClose={() => setSkillId(null)} />
      <ApiKeyDialog connector={byId(keyId)} onClose={() => setKeyId(null)} />
    </div>
  )
}
