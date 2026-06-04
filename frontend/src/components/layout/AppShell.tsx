import { Outlet } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { layout } from '@/constants/layout'
import { cn } from '@/utils/cn'
import { Sidebar } from './Sidebar'

function AppShellLayout() {
  const { collapsed } = useSidebar()

  return (
    <div
      className={cn(
        'min-h-screen bg-devflow-surface',
        collapsed && 'shell-layout--collapsed',
      )}
    >
      <Sidebar />
      <div className={layout.shellMain}>
        <Outlet />
      </div>
    </div>
  )
}

export function AppShell() {
  return (
    <SidebarProvider>
      <AppShellLayout />
    </SidebarProvider>
  )
}
