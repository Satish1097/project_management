import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/routes'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { AppContextProvider } from '@/features/context/AppContextProvider'
import { NotificationProvider } from '@/features/notifications/NotificationProvider'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { ProjectsProvider } from '@/contexts/ProjectsContext'
import { SprintsProvider } from '@/contexts/SprintsContext'
import { IssuesProvider } from '@/contexts/IssuesContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function App() {
  useDocumentTitle()

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContextProvider>
          <NotificationProvider>
            <ProjectsProvider>
              <SprintsProvider>
                <IssuesProvider>
                  <RouterProvider router={router} />
                </IssuesProvider>
              </SprintsProvider>
            </ProjectsProvider>
          </NotificationProvider>
        </AppContextProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
