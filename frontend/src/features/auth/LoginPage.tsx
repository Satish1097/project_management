import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppLogo } from '@/components/brand/AppLogo'
import { BRANDING } from '@/constants/branding'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthProvider'
import { Checkbox } from '@/components/ui/Checkbox'
import { Divider } from '@/components/ui/Divider'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { ROUTES } from '@/constants/routes'
import { ApiError } from '@/api/types'

function isInvitationRedirect(path: string): boolean {
  const [pathname, search = ''] = path.split('?')
  return pathname === ROUTES.signup && new URLSearchParams(search).has('invite_token')
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({
        email,
        password,
        rememberMe,
      })
      if (isInvitationRedirect(redirectTo)) {
        navigate(redirectTo, { replace: true })
        return
      }
      navigate(redirectTo, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to sign in. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <header className="flex w-full flex-col items-center">
        <div className="flex items-center gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
            <AppLogo className="size-10" />
          </div>
          <h1 className="text-page-title text-devflow-text">
            {BRANDING.appName}
          </h1>
        </div>
        <p className="pt-2 text-body text-devflow-text-secondary">
          {BRANDING.loginTagline}
        </p>
      </header>

      <div className="relative w-full rounded-lg border border-devflow-border bg-devflow-card p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-section-title text-devflow-text">
              Welcome back
            </h2>
            <p className="text-body text-devflow-text-secondary">
              Please enter your details to sign in.
            </p>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-body text-red-700"
            >
              {error}
            </p>
          ) : null}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />

            <PasswordInput
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              labelAction={
                <Link
                  to={ROUTES.forgotPassword}
                  className="text-body text-devflow-primary hover:underline"
                >
                  Forgot password?
                </Link>
              }
            />

            <Checkbox
              label="Remember for 30 days"
              name="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <Divider />

          <Button variant="outline" type="button" className="gap-2">
            <GoogleIcon />
            <span className="font-medium">Continue with Google</span>
          </Button>
        </div>
      </div>

      <p className="text-center text-body text-devflow-text-secondary">
        Don&apos;t have an account? Ask a workspace admin for an invitation.
      </p>

      <footer className="flex h-8 items-start justify-center gap-4 pt-2">
        <button
          type="button"
          className="font-mono text-caption-label leading-[15px] tracking-[1px] text-devflow-text-muted hover:text-devflow-text-secondary"
        >
          Privacy Policy
        </button>
        <span className="text-body text-devflow-border">•</span>
        <button
          type="button"
          className="font-mono text-caption-label leading-[15px] tracking-[1px] text-devflow-text-muted hover:text-devflow-text-secondary"
        >
          Terms of Service
        </button>
        <span className="text-body text-devflow-border">•</span>
        <button
          type="button"
          className="font-mono text-caption-label leading-[15px] tracking-[1px] text-devflow-text-muted hover:text-devflow-text-secondary"
        >
          Security
        </button>
      </footer>
    </>
  )
}
