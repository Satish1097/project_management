import { useState } from 'react'
import {
  ArrowDownUp,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  Plus,
} from 'lucide-react'
import { MyTasksHeader } from '@/components/layout/MyTasksHeader'
import { mockAssignedTasks } from '@/services/mockTasks'
import { cn } from '@/utils/cn'
import { TaskListTable } from './TaskListTable'

const assigneeTabs = [
  { id: 'assigned', label: 'Assigned to Me', count: 12 },
  { id: 'created', label: 'Created by Me', count: 4 },
  { id: 'watching', label: 'Watching', count: 8 },
] as const

export function MyTasksPage() {
  const [activeTab, setActiveTab] = useState<(typeof assigneeTabs)[number]['id']>(
    'assigned',
  )

  return (
    <>
      <MyTasksHeader />
      <main className="relative flex-1 bg-[#f7f9fb] pb-24">
        <div className="space-y-3 p-4">
          <div className="flex gap-4 border-b border-devflow-border">
            {assigneeTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 pb-2.5 pt-0.5 text-nav',
                  activeTab === tab.id
                    ? 'border-[#004191] font-semibold text-[#004191]'
                    : 'border-transparent font-normal text-[#424753]',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-caption font-semibold',
                    activeTab === tab.id
                      ? 'bg-[#e0e3e5] text-[#004191]'
                      : 'bg-[#e0e3e5] text-[#424753]',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-[#f2f4f6] px-4 py-2 text-body text-devflow-text"
              >
                <Filter className="size-3.5 text-[#424753]" />
                Status
                <ChevronDown className="size-2 text-[#424753]" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg bg-[#f2f4f6] px-4 py-2 text-body text-devflow-text"
              >
                Priority
                <ChevronDown className="size-2" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg bg-[#f2f4f6] px-4 py-2 text-body text-devflow-text"
              >
                Project
                <ChevronDown className="size-2" />
              </button>
              <span className="mx-1 h-6 w-px bg-devflow-border" />
              <button
                type="button"
                className="inline-flex items-center gap-1 px-4 py-2 text-body text-[#424753]"
              >
                <ArrowDownUp className="size-3.5" />
                Sort
              </button>
            </div>

            <div className="flex rounded-lg bg-[#f2f4f6] p-0.5">
              <button
                type="button"
                className="rounded-md bg-white p-2 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                aria-label="List view"
              >
                <List className="size-4 text-[#424753]" />
              </button>
              <button
                type="button"
                className="rounded-md p-2 text-[#424753]"
                aria-label="Board view"
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
          </div>

          <TaskListTable tasks={mockAssignedTasks} />

          <p className="text-center text-caption-label tracking-[1px] text-[#727784]">
            Demo: Toggle Empty State
          </p>
        </div>

        <button
          type="button"
          className="fixed bottom-4 right-4 flex size-11 items-center justify-center rounded-lg bg-devflow-primary text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)]"
          aria-label="Create issue"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>
      </main>
    </>
  )
}
