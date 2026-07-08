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
    const inviteToken = new URLSearchParams(location.search).get('invite_token')
    if (inviteToken) {
      if (location.pathname === ROUTES.signup) {
        return <Outlet />
      }
      return (
        <Navigate
          to={`${ROUTES.signup}?invite_token=${encodeURIComponent(inviteToken)}`}
          replace
        />
      )
    }
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return <Outlet />
}
