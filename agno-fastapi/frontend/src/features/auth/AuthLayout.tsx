import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/ui'

export interface AuthLayoutProps {
  title: string
  subtitle: string
  /** Link in the floating nav (right side). */
  navLabel: string
  navTo: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, navLabel, navTo, children, footer }: AuthLayoutProps) {
  return (
    <div className="bg-glow bg-grid relative flex min-h-dvh flex-col items-center overflow-x-hidden bg-bg px-4 pb-10">
      <header className="sticky top-4 z-10 w-full max-w-3xl pt-4">
        <nav
          aria-label="Primary"
          className="flex items-center justify-between rounded-full border border-border bg-surface/80 py-2 pl-4 pr-2 backdrop-blur"
        >
          <Link to="/" aria-label="Agno home" className="rounded-full">
            <Logo wordmark />
          </Link>
          <Link
            to={navTo}
            className="inline-flex h-9 items-center rounded-full bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-white/90 active:bg-white/80"
          >
            {navLabel}
          </Link>
        </nav>
      </header>

      <main className="flex w-full flex-1 items-center justify-center py-10">
        <div className="w-full max-w-[400px] rounded-3xl border border-border bg-surface/80 p-8 backdrop-blur-xl max-[380px]:p-6">
          <h1 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-fg">{title}</h1>
          <p className="mt-2 text-base text-fg-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <p className="mt-6 text-center text-sm text-fg-muted">{footer}</p>
        </div>
      </main>
    </div>
  )
}
