import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/routes'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { NotificationProvider } from '@/features/notifications/NotificationProvider'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function App() {
  useDocumentTitle()

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
