import { useCallback, useEffect, useRef, useState } from 'react'

import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { CreateIssueProvider } from '@/contexts/CreateIssueContext'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { useProjects } from '@/contexts/ProjectsContext'

import { layout } from '@/constants/layout'
import { parseProjectRoute, projectBacklogPath, ROUTES } from '@/constants/routes'

import { cn } from '@/utils/cn'
import { projectSwitchTrace } from '@/utils/projectSwitchTrace'

import { useAuth } from '@/features/auth/AuthProvider'

import {

  ContextLoadErrorState,

  NoProjectsOnboardingState,

} from '@/features/context/ContextEmptyState'

import { useAppContext } from '@/features/context/useAppContext'

import { CreateProjectDrawer } from '@/features/projects/CreateProjectDrawer'

import { Sidebar } from './Sidebar'



function AppShellMain() {

  const navigate = useNavigate()

  const { isLoading: authLoading } = useAuth()

  const {

    isLoading: contextLoading,

    contextError,

    organizations,

    currentOrganization,

  } = useAppContext()

  const { projects, isLoading: projectsLoading } = useProjects()

  const [createProjectOpen, setCreateProjectOpen] = useState(false)


  const handleProjectCreated = useCallback(

    (projectId: string) => {

      navigate(projectBacklogPath(projectId))

    },

    [navigate],

  )



  if (authLoading || contextLoading || (currentOrganization && projectsLoading)) {

    return null

  }



  if (contextError) {

    return <ContextLoadErrorState message={contextError} />

  }



  if (organizations.length === 0) {

    return <Navigate to={ROUTES.createWorkspace} replace />

  }



  if (currentOrganization && projects.length === 0) {

    return (

      <>

        <NoProjectsOnboardingState

          onCreateProject={() => setCreateProjectOpen(true)}

        />

        <CreateProjectDrawer

          open={createProjectOpen}

          onClose={() => setCreateProjectOpen(false)}

          onCreated={handleProjectCreated}

        />

      </>

    )

  }



  return <Outlet />

}



function AppShellLayout() {

  const { collapsed } = useSidebar()
  const { pathname } = useLocation()
  const prevPathRef = useRef(pathname)
  const { currentProject, setCurrentProject } = useAppContext()
  const { projects, isLoading: projectsLoading } = useProjects()

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      projectSwitchTrace.locationChange(prevPathRef.current, pathname)
      prevPathRef.current = pathname
    }
  }, [pathname])

  useEffect(() => {
    const { projectId } = parseProjectRoute(pathname)
    if (!projectId) return
    if (projectsLoading) return
    if (!projects.some((p) => p.id === projectId)) return
    if (currentProject?.id === projectId) {
      projectSwitchTrace.appShellSyncProject(pathname, projectId, 'skip')
      return
    }

    projectSwitchTrace.appShellSyncProject(pathname, projectId, 'set')
    projectSwitchTrace.setCurrentProject('AppShell.tsx', projectId)
    setCurrentProject(projectId)
  }, [currentProject?.id, pathname, setCurrentProject, projects, projectsLoading])



  return (

    <div

      className={cn(

        'min-h-screen bg-devflow-surface',

        collapsed && 'shell-layout--collapsed',

      )}

    >

      <Sidebar />

      <div className={layout.shellMain}>

        <AppShellMain />

      </div>

    </div>

  )

}



export function AppShell() {

  return (

    <CreateIssueProvider>

      <SidebarProvider>

        <AppShellLayout />

      </SidebarProvider>

    </CreateIssueProvider>

  )

}


