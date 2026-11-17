import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/auth'
import { Button, Field, Input } from '@/components/ui'
import { AuthLayout } from './AuthLayout'
import { ErrorBanner } from './ErrorBanner'
import { PasswordInput } from './PasswordInput'
import { EMAIL_RE, errorMessage, safeNext } from './authUtils'

type FieldErrors = { email?: string; password?: string }

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const nextParam = params.get('next')
  const next = safeNext(nextParam)

  const emailRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address.'
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.'
    else if (password.length > 128) errs.password = 'Password must be at most 128 characters.'
    return errs
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    const errs = validate()
    setFieldErrors(errs)
    if (errs.email || errs.password) return
    setBusy(true)
    try {
      await signup(email.trim(), password, name.trim() || undefined)
      navigate(next, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const loginTo = nextParam ? `/login?next=${encodeURIComponent(next)}` : '/login'

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start chatting with your tools in Dots-in Chat"
      loginTo={loginTo}
      footer={
        <>
          Already have an account?{' '}
          <Link to={loginTo} className="font-medium text-fg underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {error ? <ErrorBanner message={error} /> : null}
        <Field label="Name (optional)">
          <Input
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <Input
            ref={emailRef}
            type="email"
            name="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={!!fieldErrors.email}
            disabled={busy}
            required
          />
        </Field>
        <Field label="Password" hint="At least 8 characters" error={fieldErrors.password}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={!!fieldErrors.password}
            disabled={busy}
            required
          />
        </Field>
        <Button type="submit" variant="pill" loading={busy} className="mt-1 w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
