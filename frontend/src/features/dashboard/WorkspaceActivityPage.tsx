import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { TopHeader } from '@/components/layout/TopHeader'
import {
  getDashboardActivityPage,
  type ActivityFilterId,
  type DashboardActivityPageApi,
} from '@/api/dashboard'
import { useAppContext } from '@/features/context/useAppContext'
import { cn } from '@/utils/cn'

import { ActivityFeed } from './ActivityFeed'

const PAGE_SIZE = 10

const ACTIVITY_FILTERS: { id: ActivityFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'comments', label: 'Comments' },
  { id: 'status_changes', label: 'Status Changes' },
  { id: 'sprint_updates', label: 'Sprint Updates' },
  { id: 'member_actions', label: 'Member Actions' },
]

function parsePage(value: string | null): number {
  const parsed = Number(value ?? '1')
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

function parseFilter(value: string | null): ActivityFilterId {
  const match = ACTIVITY_FILTERS.find((filter) => filter.id === value)
  return match?.id ?? 'all'
}

export function WorkspaceActivityPage() {
  const { currentOrganization } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activityPage, setActivityPage] = useState<DashboardActivityPageApi | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const page = useMemo(() => parsePage(searchParams.get('page')), [searchParams])
  const activeFilter = useMemo(
    () => parseFilter(searchParams.get('filter')),
    [searchParams],
  )

  const workspaceName = currentOrganization?.name ?? 'your workspace'

  const loadActivity = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getDashboardActivityPage({
        page,
        pageSize: PAGE_SIZE,
        filter: activeFilter,
      })
      setActivityPage(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setIsLoading(false)
    }
  }, [activeFilter, page])

  useEffect(() => {
    void loadActivity()
  }, [loadActivity])

  const handleFilterChange = useCallback(
    (filter: ActivityFilterId) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        if (filter === 'all') {
          next.delete('filter')
        } else {
          next.set('filter', filter)
        }
        next.delete('page')
        return next
      })
    },
    [setSearchParams],
  )

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        if (nextPage > 1) {
          next.set('page', String(nextPage))
        } else {
          next.delete('page')
        }
        return next
      })
    },
    [setSearchParams],
  )

  return (
    <>
      <TopHeader variant="projects" activeTab="Board" />
      <main className="page-main">
        <div className="mx-auto w-full max-w-6xl">
          <header>
            <h1 className="text-page-title text-devflow-text">Activity</h1>
            <p className="mt-0.5 text-body text-devflow-text-secondary">
              Workspace activity for {workspaceName}
            </p>
          </header>

          <div className="mt-4 flex min-w-0 flex-wrap items-center gap-1.5">
            {ACTIVITY_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleFilterChange(id)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-nav transition-colors',
                  activeFilter === id
                    ? 'bg-[var(--df-nav-tint)] font-medium text-devflow-primary'
                    : 'text-devflow-text-secondary hover:bg-devflow-muted hover:text-devflow-text',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <ActivityFeed
              variant="full"
              showSectionHeader={false}
              showProjectName
              activities={activityPage?.results ?? null}
              isLoading={isLoading}
              error={error}
              onRetry={loadActivity}
              emptyMessage="No activity found"
              emptyHelperText={
                activeFilter === 'all'
                  ? 'Activity will appear here when issues, comments, or status updates occur in this workspace.'
                  : 'No activities match this filter yet.'
              }
              pagination={
                activityPage
                  ? {
                      count: activityPage.pagination.count,
                      next: activityPage.pagination.next,
                      previous: activityPage.pagination.previous,
                      page: activityPage.pagination.page,
                      pageSize: activityPage.pagination.page_size,
                      onPageChange: handlePageChange,
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </main>
    </>
  )
}
