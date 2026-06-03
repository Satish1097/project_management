import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DevFlowLogo } from '@/components/brand/DevFlowLogo'
import { AuthLayout } from '@/components/layout/AuthLayout'
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
import { ROUTES } from '@/constants/routes'

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
            fill="#727785"
          />
        </svg>
      ) : (
        <svg width="18" height="13" viewBox="0 0 18 13" fill="none" aria-hidden>
          <path
            d="M0.5 0.5L17.5 12.5M7.5 5.2C7.18 5.66 7 6.22 7 6.8C7 8.01 7.99 9 9.2 9C9.78 9 10.34 8.82 10.8 8.5M2.2 2.8C4.1 1.4 6.4 0.5 9 0.5C13 0.5 16.27 2.61 18 5.5C17.2 6.77 16.05 7.8 14.7 8.5"
            stroke="#727785"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  )
}

const FEATURES = [
  { icon: ShieldIcon, label: 'Secure' },
  { icon: GaugeIcon, label: 'Fast' },
  { icon: BoltIcon, label: 'Reliable' },
] as const

export function SignupPage() {
  const navigate = useNavigate()
  const [passwordVisible, setPasswordVisible] = useState(false)

  return (
    <AuthLayout variant="signup">
      <div className="flex w-full flex-col items-center pb-8">
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-devflow-primary shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <DevFlowLogo className="h-[19px] w-[23px]" />
        </div>
        <h1 className="text-page-title text-devflow-text">
          DevFlow
        </h1>
      </div>

      <div className="w-full rounded-lg border border-devflow-border bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-section-title text-devflow-text">
              Create your account
            </h2>
            <p className="text-body text-devflow-text-secondary">
              Start optimizing your engineering workflow today.
            </p>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              navigate(ROUTES.workspaceEmpty)
            }}
          >
            <IconInput
              label="Full Name"
              name="fullName"
              autoComplete="name"
              placeholder="John Doe"
              icon={<UserIcon />}
            />
            <IconInput
              label="Work Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@company.com"
              icon={<MailIcon />}
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
                  className="w-full rounded-lg border border-devflow-border bg-devflow-surface pb-[11px] pl-[41px] pr-12 pt-[10px] text-input text-devflow-text outline-none transition-colors placeholder:text-devflow-text-muted/60 focus:border-devflow-primary focus:bg-white focus:ring-2 focus:ring-devflow-primary/20"
                />
                <EyeToggle
                  visible={passwordVisible}
                  onToggle={() => setPasswordVisible((v) => !v)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="gap-1 py-2 text-section-title"
            >
              Create Account
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </form>

          <div className="flex flex-col items-center gap-4 pt-2">
            <p className="text-body text-devflow-text-secondary">
              Already have an account?{' '}
              <Link
                to={ROUTES.login}
                className="font-semibold text-devflow-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
            <p className="max-w-[312px] text-center text-caption text-devflow-text-muted">
              By signing up, you agree to our{' '}
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
    </AuthLayout>
  )
}
