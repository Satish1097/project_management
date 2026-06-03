import { MyTasksHeader } from '@/components/layout/MyTasksHeader'
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar'
import { layout } from '@/constants/layout'
import { cn } from '@/utils/cn'
import { NotificationPanel } from './NotificationPanel'

export function NotificationCenterPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <WorkspaceSidebar activeNav="inbox" />
      <div className={cn(layout.shellMain, 'flex min-h-screen flex-col')}>
        <MyTasksHeader />
        <main className="flex flex-1 justify-center px-6 py-8">
          <div className="w-full max-w-[840px] min-w-0">
            <NotificationPanel />
          </div>
        </main>
      </div>
    </div>
  )
}
