import { Outlet, useLocation } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ROUTES } from '@/constants/routes'

export function AuthLayoutRoute() {
  const { pathname } = useLocation()
  const variant = pathname === ROUTES.signup ? 'signup' : 'login'

  return (
    <AuthLayout variant={variant}>
      <Outlet />
    </AuthLayout>
  )
}
