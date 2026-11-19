import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

export function CodeBlock({ language, code, children }: { language: string; code: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (insecure context / denied)
    }
  }

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border bg-[#0b0b10]">
      <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-1.5 text-xs text-fg-muted">
        <span className="font-mono">{language || 'text'}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono text-fg">{children}</code>
      </pre>
    </div>
  )
}
