import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '@/components/ui'

const SECTIONS = [
  ['Features', '/#features'],
  ['Connectors', '/#connectors'],
  ['How it works', '/#how'],
] as const

/** White pill CTA with the black ↗ chip, as a link. */
export function PillLink({
  to,
  children,
  size = 'lg',
  className,
}: {
  to: string
  children: ReactNode
  size?: 'md' | 'lg'
  className?: string
}) {
  return (
    <Link
      to={to}
      className={clsx(
        'group inline-flex items-center rounded-full bg-white font-medium whitespace-nowrap text-black transition-colors hover:bg-white/90 active:bg-white/80',
        size === 'lg' ? 'h-12 gap-3 pl-1.5 pr-6 text-base' : 'h-10 gap-2 pl-1 pr-4 text-sm',
        className,
      )}
    >
      <span
        className={clsx(
          'grid shrink-0 place-items-center rounded-full bg-black text-white',
          size === 'lg' ? 'size-9' : 'size-8',
        )}
      >
        <ArrowUpRight
          className={clsx(
            'transition-transform group-hover:-translate-y-px group-hover:translate-x-px',
            size === 'lg' ? 'size-5' : 'size-4',
          )}
          aria-hidden
        />
      </span>
      {children}
    </Link>
  )
}

/** The floating pill nav shared by the landing, log in and sign up pages. */
export function SiteNav({ loginTo = '/login', signupTo = '/signup' }: { loginTo?: string; signupTo?: string }) {
  const { pathname } = useLocation()
  const linkClass = 'rounded-full px-3 py-2 text-[15px] text-fg-muted transition-colors hover:text-fg'

  return (
    <header className="fixed inset-x-0 top-4 z-20 px-4">
      <nav aria-label="Primary" className="glass mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-full py-2 pl-5 pr-2">
        <Link to="/" aria-label="Dots-in Chat home" className="rounded-full">
          <Logo wordmark />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {SECTIONS.map(([label, href]) => (
            <li key={href}>
              <Link to={href} className={linkClass}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <Link
            to={loginTo}
            aria-current={pathname === '/login' ? 'page' : undefined}
            className={clsx(linkClass, 'aria-[current=page]:text-fg')}
          >
            Log in
          </Link>
          <PillLink to={signupTo} size="md">
            Try now
          </PillLink>
        </div>
      </nav>
    </header>
  )
}
