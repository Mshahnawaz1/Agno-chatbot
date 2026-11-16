import { useState, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (typeof node === 'object' && 'props' in node) {
    return textOf((node.props as { children?: ReactNode }).children)
  }
  return ''
}

function CodeBlock({ language, code, children }: { language: string; code: string; children: ReactNode }) {
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

const components: Components = {
  h1: (p) => <h1 className="mb-3 mt-6 text-2xl font-semibold first:mt-0" {...p} />,
  h2: (p) => <h2 className="mb-3 mt-6 text-xl font-semibold first:mt-0" {...p} />,
  h3: (p) => <h3 className="mb-2 mt-5 text-lg font-semibold first:mt-0" {...p} />,
  h4: (p) => <h4 className="mb-2 mt-4 font-semibold first:mt-0" {...p} />,
  p: (p) => <p className="my-3 leading-7 first:mt-0 last:mb-0" {...p} />,
  ul: (p) => <ul className="my-3 list-disc space-y-1 pl-6 marker:text-fg-subtle" {...p} />,
  ol: (p) => <ol className="my-3 list-decimal space-y-1 pl-6 marker:text-fg-subtle" {...p} />,
  li: (p) => <li className="leading-7" {...p} />,
  blockquote: (p) => (
    <blockquote className="my-4 border-l-2 border-accent pl-4 text-fg-muted" {...p} />
  ),
  hr: () => <hr className="my-6 border-border" />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  a: ({ node: _node, ...p }) => (
    <a
      className="text-accent underline underline-offset-2 hover:text-[#b69bff]"
      target="_blank"
      rel="noopener noreferrer"
      {...p}
    />
  ),
  table: (p) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-left text-sm" {...p} />
    </div>
  ),
  thead: (p) => <thead className="bg-surface-2" {...p} />,
  th: (p) => <th className="border-b border-border px-3 py-2 font-semibold" {...p} />,
  td: (p) => <td className="border-t border-border px-3 py-2 align-top" {...p} />,
  pre: ({ children }) => <>{children}</>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  code: ({ className, children, node: _node, ...rest }: ComponentPropsWithoutRef<'code'> & { node?: unknown }) => {
    const match = /language-([\w-]+)/.exec(className ?? '')
    const text = textOf(children)
    const isBlock = !!match || text.includes('\n')
    if (isBlock) {
      return (
        <CodeBlock language={match?.[1] ?? ''} code={text.replace(/\n$/, '')}>
          {children}
        </CodeBlock>
      )
    }
    return (
      <code
        className="rounded-sm bg-surface-3 px-1.5 py-0.5 font-mono text-[0.875em] text-fg"
        {...rest}
      >
        {children}
      </code>
    )
  },
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('min-w-0 break-words text-fg', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
