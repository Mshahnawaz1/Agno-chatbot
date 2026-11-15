import type { ReactNode } from 'react'
import { Backdrop, SiteNav } from '@/components/site'

export interface AuthLayoutProps {
  title: string
  subtitle: string
  /** Nav targets, so a `?next=` survives switching between log in and sign up. */
  loginTo?: string
  signupTo?: string
  children: ReactNode
  footer: ReactNode
}

/** Log in / sign up: the landing page's nav and hero, with the form in a glass card. */
export function AuthLayout({ title, subtitle, loginTo, signupTo, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-x-clip bg-bg">
      <Backdrop orbClassName="-top-24 w-[min(1000px,160vw)]" fadeAt="45%" />
      <SiteNav loginTo={loginTo} signupTo={signupTo} />

      <main className="flex w-full flex-1 flex-col items-center px-4 pb-16 pt-32 sm:pt-40">
        <h1 className="text-display text-center text-[clamp(2.75rem,8vw,4.75rem)] text-fg [text-shadow:0_4px_40px_rgb(0_0_0/0.35)]">
          {title}
        </h1>
        <p className="mt-4 text-center font-display text-lg text-fg sm:text-xl">{subtitle}</p>

        <div className="glass mt-10 w-full max-w-[420px] rounded-3xl p-8 shadow-[0_-10px_60px_-10px_rgb(124_58_237/0.35)] max-[380px]:p-6">
          {children}
          <p className="mt-6 text-center text-sm text-fg-muted">{footer}</p>
        </div>
      </main>
    </div>
  )
}
