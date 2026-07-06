import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { acceptInvitation, validateInvitation, type InvitationDetails } from '@/api/auth'
import { ApiError } from '@/api/types'
import { AppLogo } from '@/components/brand/AppLogo'
import { BRANDING } from '@/constants/branding'
import { Button } from '@/components/ui/Button'
import { IconInput } from '@/components/ui/IconInput'
import {
  ArrowRightIcon,
  BoltIcon,
  GaugeIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
  UserIcon,
} from '@/components/ui/icons/AuthFieldIcons'
import { ROUTES, projectBacklogPath } from '@/constants/routes'
import { useAppContext } from '@/features/context/useAppContext'
import { useAuth } from './AuthProvider'

function EyeToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-devflow-text-muted"
      aria-label={visible ? 'Hide password' : 'Show password'}
    >
      {visible ? (
        <svg width="18" height="13" viewBox="0 0 18 13" fill="none" aria-hidden>
          <path
            d="M9 0.5C5 0.5 1.73 2.61 0 5.5C1.73 8.39 5 10.5 9 10.5C13 10.5 16.27 8.39 18 5.5C16.27 2.61 13 0.5 9 0.5ZM9 9C7.07 9 5.5 7.43 5.5 5.5C5.5 3.57 7.07 2 9 2C10.93 2 12.5 3.57 12.5 5.5C12.5 7.43 10.93 9 9 9Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg width="18" height="13" viewBox="0 0 18 13" fill="none" aria-hidden>
          <path
            d="M0.5 0.5L17.5 12.5M7.5 5.2C7.18 5.66 7 6.22 7 6.8C7 8.01 7.99 9 9.2 9C9.78 9 10.34 8.82 10.8 8.5M2.2 2.8C4.1 1.4 6.4 0.5 9 0.5C13 0.5 16.27 2.61 18 5.5C17.2 6.77 16.05 7.8 14.7 8.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  )
}

function formatApiError(err: ApiError): string {
  const passwordError = err.errors?.password?.[0]
  if (typeof passwordError === 'string') return passwordError

  const detail = err.errors?.detail
  if (Array.isArray(detail) && typeof detail[0] === 'string') return detail[0]
  if (typeof detail === 'string') return detail

  return err.message
}

const FEATURES = [
  { icon: ShieldIcon, label: 'Secure' },
  { icon: GaugeIcon, label: 'Fast' },
  { icon: BoltIcon, label: 'Reliable' },
] as const

function getInvitationRedirect(invitation: InvitationDetails | null): string {
  const projectId = invitation?.metadata.project_id
  return typeof projectId === 'string' ? projectBacklogPath(projectId) : ROUTES.dashboard
}

export function SignupPage() {
  const navigate = useNavigate()
  const { isAuthenticated, register, user } = useAuth()
  const { refreshContext } = useAppContext()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite_token') ?? ''
  const hasInviteToken = Boolean(inviteToken)

  const [passwordVisible, setPasswordVisible] = useState(false)
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(hasInviteToken)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)

  const invitedEmail = invitation?.email ?? ''
  const invitationBelongsToCurrentUser =
    Boolean(invitedEmail && user?.email.toLowerCase() === invitedEmail.toLowerCase())
  const loginRedirect = `${ROUTES.signup}?invite_token=${encodeURIComponent(inviteToken)}`
  const canCreateAccount = hasInviteToken && invitation && !invitation.account_exists

  useEffect(() => {
    let cancelled = false

    async function loadInvitation() {
      if (!hasInviteToken) {
        setInvitation(null)
        setIsValidating(false)
        setError('A valid invitation link is required to create an account.')
        return
      }

      setIsValidating(true)
      setError(null)

      try {
        const result = await validateInvitation(inviteToken)
        if (cancelled) return
        setInvitation(result)
      } catch (err) {
        if (cancelled) return
        setInvitation(null)
        setError(
          err instanceof ApiError ? formatApiError(err) : 'Unable to validate invitation.',
        )
      } finally {
        if (!cancelled) {
          setIsValidating(false)
        }
      }
    }

    void loadInvitation()

    return () => {
      cancelled = true
    }
  }, [hasInviteToken, inviteToken])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!hasInviteToken || !invitation) {
      setError('A valid invitation link is required to create an account.')
      return
    }

    if (invitation?.account_exists) {
      setError('This invitation belongs to an existing account. Sign in to accept it.')
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        invite_token: inviteToken,
        name: fullName.trim(),
        password,
      })
      await refreshContext()
      navigate(getInvitationRedirect(invitation), { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? formatApiError(err)
          : 'Unable to create account. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAcceptInvitation() {
    setError(null)

    if (!invitation) {
      setError('A valid invitation link is required to continue.')
      return
    }

    if (!invitationBelongsToCurrentUser) {
      setError(`Sign in as ${invitedEmail} to accept this invitation.`)
      return
    }

    setIsAccepting(true)

    try {
      await acceptInvitation(inviteToken)
      await refreshContext()
      navigate(getInvitationRedirect(invitation), { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError ? formatApiError(err) : 'Unable to accept invitation.',
      )
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <>
      <div className="flex w-full flex-col items-center pb-8">
        <div className="mb-3 flex size-10 items-center justify-center overflow-hidden rounded-full shadow-devflow-sm">
          <AppLogo className="size-10" />
        </div>
        <h1 className="text-page-title text-devflow-text">
          {BRANDING.appName}
        </h1>
      </div>

      <div className="w-full rounded-lg border border-devflow-border bg-devflow-card p-6 shadow-devflow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-section-title text-devflow-text">
              {!hasInviteToken
                ? 'Invitation required'
                : invitation?.account_exists
                  ? 'Accept your invitation'
                  : 'Create your account'}
            </h2>
            <p className="text-body text-devflow-text-secondary">
              {isValidating
                ? 'Checking your invitation link...'
                : hasInviteToken && invitation
                  ? BRANDING.signupTagline
                  : 'Ask a workspace admin for a valid invitation link.'}
            </p>
          </div>

          {invitedEmail ? (
            <IconInput
              label="Invited Email"
              name="email"
              type="email"
              icon={<MailIcon />}
              value={invitedEmail}
              readOnly
              disabled
            />
          ) : null}

          {!hasInviteToken || (!isValidating && hasInviteToken && !invitation) ? (
            <div className="flex flex-col gap-4">
              {error ? (
                <p className="text-caption text-red-600">{error}</p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="gap-1 py-2 text-section-title"
                onClick={() => navigate(ROUTES.login)}
              >
                Back to Sign In
              </Button>
            </div>
          ) : invitation?.account_exists ? (
            <div className="flex flex-col gap-4">
              <p className="text-body text-devflow-text-secondary">
                This email already has an account. Sign in with the invited email to add
                this workspace to your account.
              </p>

              {error ? (
                <p className="text-caption text-red-600">{error}</p>
              ) : null}

              {isAuthenticated ? (
                <Button
                  type="button"
                  className="gap-1 py-2 text-section-title"
                  disabled={!invitationBelongsToCurrentUser || isAccepting}
                  onClick={handleAcceptInvitation}
                >
                  {isAccepting ? 'Accepting invitation...' : 'Accept Invitation'}
                  {!isAccepting ? <ArrowRightIcon className="size-3.5" /> : null}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="gap-1 py-2 text-section-title"
                  onClick={() => navigate(ROUTES.login, { state: { from: loginRedirect } })}
                >
                  Sign in to accept
                  <ArrowRightIcon className="size-3.5" />
                </Button>
              )}
            </div>
          ) : canCreateAccount ? (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <IconInput
                label="Full Name"
                name="fullName"
                autoComplete="name"
                placeholder="John Doe"
                icon={<UserIcon />}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={(hasInviteToken && !invitation) || isValidating || isSubmitting}
              />
              <div className="flex w-full flex-col gap-1">
                <label
                  htmlFor="signup-password"
                  className="text-label text-devflow-text-secondary"
                >
                  Password
                </label>
                <div className="relative w-full">
                  <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center">
                    <LockIcon />
                  </span>
                  <input
                    id="signup-password"
                    name="password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={(hasInviteToken && !invitation) || isValidating || isSubmitting}
                    className="w-full rounded-lg border border-devflow-border bg-devflow-surface pb-[11px] pl-[41px] pr-12 pt-[10px] text-input text-devflow-text outline-none transition-colors placeholder:text-devflow-text-muted/60 focus:border-devflow-primary focus:bg-devflow-card focus:ring-2 focus:ring-devflow-primary/20 disabled:opacity-60"
                  />
                  <EyeToggle
                    visible={passwordVisible}
                    onToggle={() => setPasswordVisible((v) => !v)}
                  />
                </div>
              </div>

              {error ? (
                <p className="text-caption text-red-600">{error}</p>
              ) : null}

              <Button
                type="submit"
                className="gap-1 py-2 text-section-title"
                disabled={(hasInviteToken && !invitation) || isValidating || isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
                {!isSubmitting ? <ArrowRightIcon className="size-3.5" /> : null}
              </Button>
            </form>
          ) : null}
          {isValidating ? (
            <p className="text-center text-caption text-devflow-text-muted">
              Validating invitation...
            </p>
          ) : null}

          <div className="flex flex-col items-center gap-4 pt-2">
            {!invitation?.account_exists ? (
              <p className="text-body text-devflow-text-secondary">
                Already have an account?{' '}
                <Link
                  to={ROUTES.login}
                  state={hasInviteToken ? { from: loginRedirect } : undefined}
                  className="font-semibold text-devflow-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            ) : null}
            <p className="max-w-[312px] text-center text-caption text-devflow-text-muted">
              {invitation?.account_exists ? 'By accepting' : 'By signing up'}, you agree
              to our{' '}
              <button type="button" className="underline">
                Terms of Service
              </button>{' '}
              and{' '}
              <button type="button" className="underline">
                Privacy Policy
              </button>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="grid w-full max-w-[384px] grid-cols-3 gap-4 pt-8 opacity-60">
        {FEATURES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1"
          >
            <Icon className="text-devflow-text-muted" />
            <span className="text-caption-label leading-[16.5px] tracking-[1.1px] text-devflow-text-muted">
              {label}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
