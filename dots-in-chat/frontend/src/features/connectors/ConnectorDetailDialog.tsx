import { useState, type ReactNode } from 'react'
import { Button, Dialog, DialogContent, Switch } from '@/components/ui'
import type { Connector } from '@/lib/types'
import { Chips, ConnectorIcon } from './ConnectorIcon'
import { getConnectorMeta } from './connectorMeta'
import { useDisconnect, useToggleConnector } from './queries'

type Props = {
  connector: Connector | null
  onClose: () => void
  onConnect: (id: string) => Promise<void>
  onViewSkill: (c: Connector) => void
}

export function ConnectorDetailDialog({ connector, onClose, onConnect, onViewSkill }: Props) {
  return (
    <Dialog open={!!connector} onOpenChange={(o) => !o && onClose()}>
      {connector ? (
        <DetailBody key={connector.id} connector={connector} onClose={onClose} onConnect={onConnect} onViewSkill={onViewSkill} />
      ) : null}
    </Dialog>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 py-3 sm:flex-row sm:gap-4">
      <dt className="w-28 shrink-0 text-sm font-medium text-fg-subtle">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm text-fg-muted">{children}</dd>
    </div>
  )
}

function DetailBody({ connector: c, onClose, onConnect, onViewSkill }: Omit<Props, 'connector'> & { connector: Connector }) {
  const toggle = useToggleConnector()
  const disconnect = useDisconnect()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { provider } = getConnectorMeta(c.id, c.name)

  async function onSwitch(next: boolean) {
    setError(null)
    if (next && !c.connected) {
      setBusy(true)
      try {
        await onConnect(c.id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not start the connection.')
      } finally {
        setBusy(false)
      }
      return
    }
    toggle.mutate(
      { id: c.id, enabled: next },
      { onError: (e) => setError(e.message) },
    )
  }

  function doDisconnect() {
    setError(null)
    disconnect.mutate(c.id, {
      onSuccess: onClose,
      onError: (e) => {
        setError(e.message)
        setConfirming(false)
      },
    })
  }

  return (
    <DialogContent
      title={
        <span className="flex items-center gap-3">
          <ConnectorIcon id={c.id} name={c.name} className="size-12" />
          <span className="flex min-w-0 flex-col">
            <span>{c.name}</span>
            <span className="text-sm font-normal text-fg-subtle">by {provider}</span>
          </span>
        </span>
      }
      className="max-w-[560px]"
    >
      <p className="text-sm leading-6 text-fg-muted">{c.notes}</p>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-border bg-surface-2 px-4 py-3">
        <div>
          <div id="enabled-label" className="text-sm font-medium text-fg">
            Enabled
          </div>
          <div className="text-xs text-fg-subtle">
            {c.connected ? 'Turning off keeps you logged in.' : 'Turning on starts the login.'}
          </div>
        </div>
        <Switch
          aria-labelledby="enabled-label"
          checked={c.connected && c.enabled}
          disabled={busy || toggle.isPending}
          onCheckedChange={onSwitch}
        />
      </div>

      <dl className="mt-2 divide-y divide-border">
        <Row label="Server">
          <code className="break-all font-mono text-xs text-fg">{c.url}</code>
        </Row>
        <Row label="Permissions">
          {c.scopes.length ? <Chips items={c.scopes} /> : 'Server default'}
        </Row>
        <Row label="Tools">
          {c.tools && c.tools.length ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-fg-subtle">{c.tools.length} tools</span>
              <Chips items={c.tools} />
            </div>
          ) : (
            'Every tool the server offers (attached on demand)'
          )}
        </Row>
        <Row label="Skill">
          {c.skill ? (
            <div className="flex flex-col items-start gap-2">
              <span>{c.skill}</span>
              <Button variant="secondary" size="sm" onClick={() => onViewSkill(c)}>
                View SKILL.md
              </Button>
            </div>
          ) : (
            'None'
          )}
        </Row>
      </dl>

      {error && (
        <p role="alert" className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {c.connected && (
        <div className="mt-4 border-t border-border pt-4">
          {confirming ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-fg">
                Disconnect {c.name}? You'll need to log in again.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={disconnect.isPending}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="border border-danger/40"
                  loading={disconnect.isPending}
                  onClick={doDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
              Disconnect
            </Button>
          )}
        </div>
      )}
    </DialogContent>
  )
}
