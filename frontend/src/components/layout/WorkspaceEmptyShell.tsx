import { Outlet } from 'react-router-dom'
import { layout } from '@/constants/layout'
import { EmptyWorkspaceSidebar } from './EmptyWorkspaceSidebar'

export function WorkspaceEmptyShell() {
  return (
    <div className="min-h-screen bg-devflow-card">
      <EmptyWorkspaceSidebar />
      <div className={layout.shellMain}>
        <Outlet />
      </div>
    </div>
  )
}
