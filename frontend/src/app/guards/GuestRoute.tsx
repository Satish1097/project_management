import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/AuthProvider'

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    const isInvitationSignup =
      location.pathname === ROUTES.signup &&
      new URLSearchParams(location.search).has('invite_token')
    if (isInvitationSignup) {
      return <Outlet />
    }
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return <Outlet />
}
