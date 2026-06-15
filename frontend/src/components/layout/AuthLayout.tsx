import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/utils/cn'

type AuthLayoutProps = {
  children: ReactNode
  variant?: 'login' | 'signup'
}

export function AuthLayout({ children, variant = 'login' }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-screen w-full items-center justify-center bg-devflow-surface',
        variant === 'login' && 'px-4 py-12',
        variant === 'signup' && 'px-4 py-10',
      )}
      style={
        variant === 'login'
          ? {
              backgroundImage: [
                'radial-gradient(ellipse 362px 290px at 0% 0%, var(--df-auth-gradient) 0%, transparent 50%)',
                'radial-gradient(ellipse 362px 290px at 100% 100%, var(--df-auth-gradient) 0%, transparent 50%)',
              ].join(', '),
            }
          : undefined
      }
    >
      <div className="absolute right-4 top-4">
        <ThemeToggle variant="pill" />
      </div>
      <div
        className={cn(
          'flex w-full max-w-[440px] flex-col items-center',
          variant === 'login' && 'gap-4',
        )}
      >
        {children}
      </div>
    </div>
  )
}
