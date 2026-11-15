import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/auth'
import { Button, Field, Input } from '@/components/ui'
import { AuthLayout } from './AuthLayout'
import { ErrorBanner } from './ErrorBanner'
import { PasswordInput } from './PasswordInput'
import { errorMessage, safeNext } from './authUtils'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const nextParam = params.get('next')
  const next = safeNext(nextParam)
  const expired = params.get('expired') === '1'

  const emailRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      await login(email.trim(), password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const banner = error ?? (expired ? 'Your session expired. Please log in again.' : null)
  const signupTo = nextParam ? `/signup?next=${encodeURIComponent(next)}` : '/signup'

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue to Agno"
      navLabel="Sign up"
      navTo={signupTo}
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to={signupTo} className="font-medium text-fg underline-offset-4 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {banner ? <ErrorBanner message={banner} /> : null}
        <Field label="Email">
          <Input
            ref={emailRef}
            type="email"
            name="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            required
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            required
          />
        </Field>
        <Button type="submit" variant="pill" loading={busy} className="mt-1 w-full">
          Log in
        </Button>
      </form>
    </AuthLayout>
  )
}
