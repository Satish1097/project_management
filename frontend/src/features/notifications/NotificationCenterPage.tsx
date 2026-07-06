import { useEffect } from 'react'
import { MyTasksHeader } from '@/components/layout/MyTasksHeader'
import { cn } from '@/utils/cn'
import { NotificationPanel } from './NotificationPanel'
import { useNotifications } from './NotificationProvider'

export function NotificationCenterPage() {
  const { reload } = useNotifications()

  useEffect(() => {
    void reload()
  }, [reload])

  return (
    <div className={cn('flex min-h-screen flex-col bg-devflow-surface')}>
      <MyTasksHeader />
      <main className="flex flex-1 justify-center px-6 py-8">
        <div className="w-full max-w-[840px] min-w-0">
          <NotificationPanel />
        </div>
      </main>
    </div>
  )
}
