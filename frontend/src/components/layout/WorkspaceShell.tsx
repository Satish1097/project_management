import { Outlet } from 'react-router-dom'
import { layout } from '@/constants/layout'
import { WorkspaceSidebar } from './WorkspaceSidebar'

type WorkspaceShellProps = {
  activeNav?: 'myIssues' | 'projects' | 'search' | 'inbox'
}

export function WorkspaceShell({ activeNav }: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <WorkspaceSidebar activeNav={activeNav} />
      <div className={layout.shellMain}>
        <Outlet />
      </div>
    </div>
  )
}
