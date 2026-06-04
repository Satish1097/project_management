import {
  ArrowDownUp,
  Filter,
  LayoutGrid,
  List,
  Plus,
} from 'lucide-react'
import { MyTasksHeader } from '@/components/layout/MyTasksHeader'
import { issueProjects } from '@/services/mockTasks'
import { cn } from '@/utils/cn'
import { IssueBoardView } from './IssueBoardView'
import { IssueFilterMenus } from './IssueFilterMenu'
import { IssueListView } from './IssueListView'
import { useIssues } from './useIssues'
import './issues-board.css'

const assigneeTabs = [
  { id: 'assigned' as const, label: 'Assigned to Me', count: 12 },
  { id: 'created' as const, label: 'Created by Me', count: 4 },
  { id: 'watching' as const, label: 'Watching', count: 8 },
]

const sortLabels = {
  default: 'Sort',
  priority: 'Sort: Priority',
  dueDate: 'Sort: Due date',
  title: 'Sort: Title',
} as const

export function MyTasksPage() {
  const {
    visibleTasks,
    tasksByStatus,
    viewMode,
    setViewMode,
    assigneeTab,
    setAssigneeTab,
    filters,
    updateFilter,
    sortKey,
    cycleSort,
    moveTaskToStatus,
  } = useIssues()

  return (
    <>
      <MyTasksHeader />
      <main className="relative flex-1 bg-devflow-surface pb-24">
        <div className="space-y-3 p-4">
          <div className="flex gap-4 border-b border-devflow-border">
            {assigneeTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAssigneeTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 pb-2.5 pt-0.5 text-nav',
                  assigneeTab === tab.id
                    ? 'border-devflow-brand font-semibold text-devflow-brand'
                    : 'border-transparent font-normal text-devflow-text-secondary',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-caption font-semibold',
                    assigneeTab === tab.id
                      ? 'bg-devflow-subtle text-devflow-brand'
                      : 'bg-devflow-subtle text-devflow-text-secondary',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="sr-only">Filters</span>
              <Filter className="size-3.5 text-devflow-text-secondary sm:hidden" aria-hidden />
              <IssueFilterMenus
                filters={filters}
                projects={issueProjects}
                onFilterChange={updateFilter}
              />
              <span className="mx-1 h-6 w-px bg-devflow-border" />
              <button
                type="button"
                onClick={cycleSort}
                className="inline-flex items-center gap-1 px-4 py-2 text-body text-devflow-text-secondary hover:text-devflow-text"
              >
                <ArrowDownUp className="size-3.5" />
                {sortLabels[sortKey]}
              </button>
            </div>

            <div
              className="flex rounded-lg bg-devflow-muted p-0.5"
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-md p-2 transition-colors',
                  viewMode === 'list'
                    ? 'bg-devflow-card shadow-devflow-sm'
                    : 'text-devflow-text-secondary hover:text-devflow-text',
                )}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List
                  className={cn(
                    'size-4',
                    viewMode === 'list'
                      ? 'text-devflow-text'
                      : 'text-devflow-text-secondary',
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={cn(
                  'rounded-md p-2 transition-colors',
                  viewMode === 'board'
                    ? 'bg-devflow-card shadow-devflow-sm'
                    : 'text-devflow-text-secondary hover:text-devflow-text',
                )}
                aria-label="Board view"
                aria-pressed={viewMode === 'board'}
              >
                <LayoutGrid
                  className={cn(
                    'size-4',
                    viewMode === 'board'
                      ? 'text-devflow-text'
                      : 'text-devflow-text-secondary',
                  )}
                />
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <IssueListView tasks={visibleTasks} />
          ) : (
            <IssueBoardView
              tasksByStatus={tasksByStatus}
              onMoveTask={moveTaskToStatus}
            />
          )}

          <p className="text-center text-caption-label tracking-[1px] text-devflow-text-muted">
            Demo: Toggle Empty State
          </p>
        </div>

        <button
          type="button"
          className="fixed bottom-4 right-4 flex size-11 items-center justify-center rounded-lg bg-devflow-primary text-white shadow-devflow-lg"
          aria-label="Create issue"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>
      </main>
    </>
  )
}
