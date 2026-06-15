import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { IssueDetailProvider } from '@/contexts/IssueDetailContext'
import { useAuth } from '@/features/auth/AuthProvider'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  return (
    <IssueDetailProvider>
      <Outlet />
    </IssueDetailProvider>
  )
}
