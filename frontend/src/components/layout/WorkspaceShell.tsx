import { Outlet } from 'react-router-dom'
import { layout } from '@/constants/layout'
import { WorkspaceSidebar } from './WorkspaceSidebar'

export function WorkspaceShell() {
  return (
    <div className="min-h-screen bg-devflow-main">
      <WorkspaceSidebar />
      <div className={layout.shellMain}>
        <Outlet />
      </div>
    </div>
  )
}
