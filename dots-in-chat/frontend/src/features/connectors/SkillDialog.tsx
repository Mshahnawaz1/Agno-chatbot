import { Button, Dialog, DialogContent, Spinner } from '@/components/ui'
import { Markdown } from '@/components/Markdown'
import type { Connector } from '@/lib/types'
import { Chips } from './ConnectorIcon'
import { useSkill } from './queries'

export function SkillDialog({ connector, onClose }: { connector: Connector | null; onClose: () => void }) {
  return (
    <Dialog open={!!connector} onOpenChange={(o) => !o && onClose()}>
      {connector ? <SkillBody connector={connector} /> : null}
    </Dialog>
  )
}

function SkillBody({ connector }: { connector: Connector }) {
  const { data, isPending, error, refetch } = useSkill(connector.id, true)
  return (
    <DialogContent
      title={`${connector.name} · SKILL.md`}
      description={data?.description}
      className="max-w-2xl"
    >
      {isPending ? (
        <div className="flex items-center gap-2 py-6 text-sm text-fg-muted">
          <Spinner label="Loading skill" /> Loading skill…
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-start gap-3 text-sm text-danger">
          {error.message}
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.allowed_tools.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-fg">Tools it attaches when loaded</h3>
              <Chips items={data.allowed_tools} />
            </section>
          )}
          <div className="rounded-md border border-border bg-bg p-4 text-sm">
            <Markdown>{data.instructions}</Markdown>
          </div>
        </div>
      )}
    </DialogContent>
  )
}
