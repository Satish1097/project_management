import { Outlet } from 'react-router-dom'
import { layout } from '@/constants/layout'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-devflow-surface">
      <Sidebar />
      <div className={layout.shellMain}>
        <Outlet />
      </div>
    </div>
  )
}
