import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/routes'
import { NotificationProvider } from '@/features/notifications/NotificationProvider'

export default function App() {
  return (
    <NotificationProvider>
      <RouterProvider router={router} />
    </NotificationProvider>
  )
}
