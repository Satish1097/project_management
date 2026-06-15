import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AppLogo } from '@/components/brand/AppLogo'
import { BRANDING } from '@/constants/branding'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { ROUTES } from '@/constants/routes'
import { resetPassword } from '@/api/password'
import { ApiError } from '@/api/types'

function formatApiError(err: ApiError): string {
  const passwordError = err.errors?.password?.[0]
  if (typeof passwordError === 'string') return passwordError

  const detail = err.errors?.detail
  if (Array.isArray(detail) && typeof detail[0] === 'string') return detail[0]
  if (typeof detail === 'string') return detail

  return err.message
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') ?? ''
  const token = searchParams.get('token') ?? ''
  const hasResetParams = Boolean(uid && token)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(
    hasResetParams ? null : 'Invalid password reset link.',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!success) return

    const timer = window.setTimeout(() => {
      navigate(ROUTES.login, { replace: true })
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [success, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!hasResetParams) {
      setError('Invalid password reset link.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await resetPassword(uid, token, password)
      setSuccess(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(formatApiError(err))
      } else {
        setError('Unable to reset password. Please try again.')
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
          {success ? (
            <>
              <div>
                <h2 className="text-section-title text-devflow-text">Password updated successfully.</h2>
                <p className="text-body text-devflow-text-secondary">
                  Redirecting you to sign in…
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-section-title text-devflow-text">Reset Password</h2>
                <p className="text-body text-devflow-text-secondary">
                  Choose a new password for your account.
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
                <PasswordInput
                  label="New Password"
                  name="password"
                  id="new-password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting || !hasResetParams}
                />

                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  id="confirm-password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting || !hasResetParams}
                />

                <Button type="submit" disabled={isSubmitting || !hasResetParams}>
                  {isSubmitting ? 'Resetting…' : 'Reset Password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      {!success ? (
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
