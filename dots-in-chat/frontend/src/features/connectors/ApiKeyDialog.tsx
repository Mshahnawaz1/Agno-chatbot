import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button, Dialog, DialogContent, Field, IconButton, Input } from '@/components/ui'
import type { Connector } from '@/lib/types'
import { useSaveApiKey } from './queries'

export function ApiKeyDialog({ connector, onClose }: { connector: Connector | null; onClose: () => void }) {
  return (
    <Dialog open={!!connector} onOpenChange={(o) => !o && onClose()}>
      {connector ? <ApiKeyForm key={connector.id} connector={connector} onClose={onClose} /> : null}
    </Dialog>
  )
}

function ApiKeyForm({ connector, onClose }: { connector: Connector; onClose: () => void }) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const save = useSaveApiKey()

  function submit(e: FormEvent) {
    e.preventDefault()
    const apiKey = key.trim()
    if (!apiKey) return
    save.mutate({ id: connector.id, apiKey }, { onSuccess: onClose })
  }

  return (
    <DialogContent
      title={`Connect ${connector.name}`}
      description={`${connector.name} uses an API key instead of a login. Paste yours below.`}
      className="max-w-md"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="API key" error={save.error?.message}>
          <div className="relative">
            <Input
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              autoFocus
              className="pr-11"
            />
            <IconButton
              aria-label={show ? 'Hide API key' : 'Show API key'}
              size="sm"
              tooltip={false}
              onClick={() => setShow((s) => !s)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
            >
              {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </IconButton>
          </div>
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={!key.trim()}>
            Save
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
