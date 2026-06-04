import { Outlet } from 'react-router-dom'
import { SettingsSubNav } from '@/components/layout/SettingsSubNav'

export function ProjectSettingsLayout() {
  return (
    <div className="flex min-h-0 flex-1">
      <SettingsSubNav />
      <section className="flex-1 overflow-auto bg-devflow-card p-4">
        <Outlet />
      </section>
    </div>
  )
}
