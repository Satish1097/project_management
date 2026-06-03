import { Link, useNavigate } from 'react-router-dom'
import { DevFlowLogo } from '@/components/brand/DevFlowLogo'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Divider } from '@/components/ui/Divider'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { ROUTES } from '@/constants/routes'

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <AuthLayout variant="login">
      <header className="flex w-full flex-col items-center">
        <div className="flex items-center gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-devflow-primary">
            <DevFlowLogo />
          </div>
          <h1 className="text-page-title text-devflow-text">
            DevFlow
          </h1>
        </div>
        <p className="pt-2 text-body text-devflow-text-secondary">
          Streamlined engineering operations
        </p>
      </header>

      <div className="relative w-full rounded-lg border border-devflow-border bg-white p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-section-title text-devflow-text">
              Welcome back
            </h2>
            <p className="text-body text-devflow-text-secondary">
              Please enter your details to sign in.
            </p>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              navigate(ROUTES.workspaceEmpty)
            }}
          >
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@company.com"
            />

            <PasswordInput
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              labelAction={
                <button
                  type="button"
                  className="text-body text-devflow-primary"
                >
                  Forgot password?
                </button>
              }
            />

            <Checkbox label="Remember for 30 days" name="remember" />

            <Button type="submit">Sign in</Button>
          </form>

          <Divider />

          <Button variant="outline" type="button" className="gap-2">
            <GoogleIcon />
            <span className="font-medium">Continue with Google</span>
          </Button>
        </div>
      </div>

      <p className="text-center text-body text-devflow-text-secondary">
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.signup}
          className="font-semibold text-devflow-primary hover:underline"
        >
          Sign up
        </Link>
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
    </AuthLayout>
  )
}
