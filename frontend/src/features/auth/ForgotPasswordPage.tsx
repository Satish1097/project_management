import { Link, useNavigate } from 'react-router-dom'
import { AppLogo } from '@/components/brand/AppLogo'
import { BRANDING } from '@/constants/branding'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/constants/routes'

export function ForgotPasswordPage() {
  const navigate = useNavigate()

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
          <div>
            <h2 className="text-section-title text-devflow-text">
              Forgot password?
            </h2>
            <p className="text-body text-devflow-text-secondary">
              Enter your email and we will send you a reset link.
            </p>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              navigate(ROUTES.login)
            }}
          >
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@company.com"
            />
            <Button type="submit">Send reset link</Button>
          </form>
        </div>
      </div>

      <p className="text-center text-body text-devflow-text-secondary">
        Remember your password?{' '}
        <Link
          to={ROUTES.login}
          className="font-semibold text-devflow-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
