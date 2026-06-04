import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/AuthProvider'
import { cn } from '@/utils/cn'

export function ForbiddenPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-devflow-surface px-4">
      <p className="font-mono text-caption-label tracking-[1px] text-devflow-text-muted">
        403
      </p>
      <h1 className="text-page-title text-devflow-text">Access denied</h1>
      <p className="max-w-md text-center text-body text-devflow-text-secondary">
        You do not have permission to view this resource.
      </p>
      <Link
        to={isAuthenticated ? ROUTES.dashboard : ROUTES.login}
        className={cn(
          'inline-flex items-center justify-center rounded-lg bg-devflow-primary px-6 py-2 text-btn text-white',
          'shadow-devflow-sm hover:bg-devflow-primary-hover',
        )}
      >
        {isAuthenticated ? 'Back to dashboard' : 'Go to sign in'}
      </Link>
    </div>
  )
}
