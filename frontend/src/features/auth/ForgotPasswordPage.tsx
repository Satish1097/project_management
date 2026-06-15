import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AppLogo } from '@/components/brand/AppLogo'
import { BRANDING } from '@/constants/branding'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/constants/routes'
import { requestPasswordReset } from '@/api/password'
import { ApiError } from '@/api/types'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await requestPasswordReset(email)
      setSubmitted(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to send reset link. Please try again.')
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
          <h1 className="text-page-title text-devflow-text">{BRANDING.appName}</h1>
        </div>
        <p className="pt-2 text-body text-devflow-text-secondary">
          Reset your password
        </p>
      </header>

      <div className="relative w-full rounded-lg border border-devflow-border bg-devflow-card p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4">
          {submitted ? (
            <>
              <div>
                <h2 className="text-section-title text-devflow-text">Check your email</h2>
                <p className="text-body text-devflow-text-secondary">
                  If an account exists for this email, a password reset link has been sent.
                </p>
              </div>
              <Link
                to={ROUTES.login}
                className="text-center text-body font-semibold text-devflow-primary hover:underline"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-section-title text-devflow-text">Forgot Password</h2>
                <p className="text-body text-devflow-text-secondary">
                  Enter your email address and we&apos;ll send you a reset link.
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      {!submitted ? (
        <p className="text-center text-body text-devflow-text-secondary">
          Remember your password?{' '}
          <Link
            to={ROUTES.login}
            className="font-semibold text-devflow-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      ) : null}
    </>
  )
}
