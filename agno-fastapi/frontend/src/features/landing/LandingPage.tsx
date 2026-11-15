import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { Gauge, LibraryBig, MousePointerClick, Plug, Route, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '@/components/ui'
import { Backdrop, PillLink, SiteNav } from '@/components/site'
import { ConnectorIcon } from '@/features/connectors/ConnectorIcon'
import { getConnectorMeta } from '@/features/connectors/connectorMeta'
import { ChatPreview } from './ChatPreview'

const CONNECTORS = [
  { id: 'todoist', name: 'Todoist' },
  { id: 'reclaim', name: 'Reclaim' },
  { id: 'sunsama', name: 'Sunsama' },
  { id: 'habitify', name: 'Habitify' },
  { id: 'fathom', name: 'Fathom' },
  { id: 'typeform', name: 'Typeform' },
]

const FEATURES = [
  {
    icon: Plug,
    title: 'Works inside your tools',
    body: 'Connect Todoist, Reclaim, Sunsama and more with one sign-in each. Switch any of them off whenever you like.',
    wide: true,
  },
  {
    icon: MousePointerClick,
    title: 'Replies you can click',
    body: 'Checklists, forms and buttons appear right in the chat, so you confirm a plan instead of retyping it.',
    wide: true,
  },
  {
    icon: Route,
    title: 'Knows where things go',
    body: 'Skills teach it your rules, like which app gets a new task when both are connected.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by default',
    body: 'Personal details such as ID numbers and birth dates are masked before any model sees them.',
  },
  {
    icon: LibraryBig,
    title: 'Grounded answers',
    body: 'It searches its knowledge base before answering, so replies come from your docs, not guesses.',
  },
  {
    icon: Gauge,
    title: 'Every step visible',
    body: 'Open any reply to see the tools it called, the tokens it used and how long it took.',
  },
]

const STEPS = [
  { n: '01', title: 'Create an account', body: 'Sign up with an email and password. It takes a few seconds.' },
  { n: '02', title: 'Connect your apps', body: 'Pick the tools you use from the connectors page and sign in once.' },
  { n: '03', title: 'Just ask', body: '“Plan my day”, “Summarize my last meeting”. It does the clicking for you.' },
]

function Hero() {
  return (
    <section className="relative isolate overflow-x-clip pt-36 sm:pt-44">
      <Backdrop />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 text-center">
        <h1 className="text-display text-[clamp(3.25rem,11vw,8rem)] leading-[0.95] text-fg [text-shadow:0_4px_40px_rgb(0_0_0/0.35)]">
          Your day, handled
        </h1>
        <p className="mt-5 font-display text-lg text-fg sm:text-2xl">the AI assistant that works inside your tools</p>
        <PillLink to="/signup" className="mt-9">
          Try now
        </PillLink>
      </div>

      <div className="relative mx-auto mt-20 max-w-3xl px-4 [mask-image:linear-gradient(to_bottom,#000_65%,transparent)] sm:mt-28">
        <ChatPreview />
      </div>
    </section>
  )
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium tracking-wide text-accent uppercase">{eyebrow}</p>
      <h2 className="text-display mt-3 text-4xl text-fg sm:text-5xl">{title}</h2>
      {body ? <p className="mt-4 text-lg text-fg-muted">{body}</p> : null}
    </div>
  )
}

function Connectors() {
  return (
    <section id="connectors" className="scroll-mt-28 px-4 py-20">
      <p className="text-center text-sm text-fg-subtle">Connects to the apps you already plan with</p>
      <ul className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-3">
        {CONNECTORS.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-3 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-5"
          >
            <ConnectorIcon id={c.id} name={c.name} className="size-9 rounded-full p-1 [&>span]:rounded-full [&>span]:text-sm" />
            <span className="text-sm text-fg">
              {c.name}
              <span className="sr-only"> by {getConnectorMeta(c.id, c.name).provider}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="scroll-mt-28 px-4 py-24">
      <SectionHeading
        eyebrow="Features"
        title="Less switching, more done"
        body="One conversation that reads your tasks, books your time and shows its work."
      />
      <ul className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body, wide }) => (
          <li
            key={title}
            className={clsx(
              'group relative overflow-hidden rounded-3xl border border-border bg-surface p-7 transition-colors hover:border-border-strong',
              wide && 'lg:col-span-2',
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/20 opacity-0 blur-3xl transition-opacity group-hover:opacity-100"
            />
            <span className="grid size-11 place-items-center rounded-xl border border-border bg-surface-3 text-accent">
              <Icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-6 text-xl font-medium text-fg">{title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-28 px-4 py-24">
      <SectionHeading eyebrow="How it works" title="Up and running in a minute" />
      <ol className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="rounded-3xl border border-border bg-surface/60 p-7">
            <span className="bg-gradient-to-br from-accent to-accent-2 bg-clip-text font-display text-4xl font-medium text-transparent">
              {s.n}
            </span>
            <h3 className="mt-5 text-xl font-medium text-fg">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="px-4 py-24">
      <div className="bg-glow relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-surface px-6 py-20 text-center">
        <h2 className="text-display mx-auto max-w-2xl text-4xl text-fg sm:text-6xl">Start with one sentence</h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-fg-muted">Tell it what your day needs. It handles the apps.</p>
        <PillLink to="/signup" className="mt-9">
          Try now
        </PillLink>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo wordmark size={24} />
        <p className="text-sm text-fg-subtle">© {new Date().getFullYear()} Agno</p>
        <div className="flex gap-5 text-sm text-fg-muted">
          <Link to="/login" className="hover:text-fg">
            Log in
          </Link>
          <Link to="/signup" className="hover:text-fg">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  const { hash } = useLocation()
  // Nav links on other pages point at "/#section"; scroll there once the page is in.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg">
      <SiteNav />
      <main>
        <Hero />
        <Connectors />
        <Features />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
