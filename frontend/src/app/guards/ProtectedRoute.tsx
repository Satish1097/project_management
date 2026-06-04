import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { CreateIssueProvider } from '@/contexts/CreateIssueContext'
import { IssueDetailProvider } from '@/contexts/IssueDetailContext'
import { useAuth } from '@/features/auth/AuthProvider'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

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
    <CreateIssueProvider>
      <IssueDetailProvider>
        <Outlet />
      </IssueDetailProvider>
    </CreateIssueProvider>
  )
}
