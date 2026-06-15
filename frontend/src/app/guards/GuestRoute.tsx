import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/AuthProvider'

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return <Outlet />
}
