import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { BacklogBulkBar } from '@/components/issues/BacklogBulkBar'
import { BacklogIssueRow, BacklogIssueRowHeader } from '@/components/issues/BacklogIssueRow'
import { BacklogMobileCard } from '@/components/issues/BacklogMobileCard'
import {
  BacklogCreateButton,
  BacklogQuickCreate,
} from '@/components/issues/BacklogQuickCreate'
import { BacklogSprintSidebar } from '@/components/issues/BacklogSprintSidebar'
import {
  BACKLOG_TABLE_MIN_WIDTH,
  BACKLOG_TABLE_SCROLL,
  BACKLOG_TABLE_SHELL,
  BACKLOG_TOOLBAR,
} from '@/components/issues/backlogTableLayout'
import { useIssues } from '@/contexts/IssuesContext'
import { useLoadProjectSprints } from '@/hooks/useLoadProjectSprints'
import { useOptimisticIssueActions } from '@/hooks/useOptimisticIssueActions'
import { getProjectById, getSprintsForProject } from '@/services/projectData'
import { ApiError } from '@/api/types'
import type { ProjectIssue } from '@/types/issues'
import { cn } from '@/utils/cn'

const ENTER_ANIMATION_MS = 220
const EXIT_ANIMATION_MS = 200

export function ProjectBacklogPage() {
  const { projectId = '' } = useParams()
  const project = getProjectById(projectId)
  const { issues, loadBacklog, backlogLoading, backlogError } = useIssues()
  const { bulkAssignSprintOptimistic } = useOptimisticIssueActions(projectId)
  useLoadProjectSprints(projectId)

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [moveError, setMoveError] = useState<string | null>(null)
  const [newIssueOrder, setNewIssueOrder] = useState<string[]>([])
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set())
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (projectId) {
      void loadBacklog(projectId)
    }
  }, [projectId, loadBacklog])

  const plannedSprints = getSprintsForProject(projectId).filter(
    (s) => s.status === 'planned' || s.status === 'active',
  )

  const projectBacklogIssues = useMemo(
    () =>
      issues.filter((i) => i.projectId === projectId && i.sprintId === null),
    [issues, projectId],
  )

  const backlog = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = projectBacklogIssues.filter((i) => {
      if (!q) return true
      return (
        i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)
      )
    })

    const orderIndex = (id: string) => {
      const idx = newIssueOrder.indexOf(id)
      return idx === -1 ? Number.POSITIVE_INFINITY : idx
    }

    return [...filtered].sort((a, b) => orderIndex(a.id) - orderIndex(b.id))
  }, [projectBacklogIssues, query, newIssueOrder])

  const selectedIds = useMemo(() => [...selected], [selected])
  const allSelected = backlog.length > 0 && selected.size === backlog.length
  const isBacklogEmpty = projectBacklogIssues.length === 0 && !backlogLoading
  const hasSearchQuery = query.trim().length > 0
  const noSearchResults = hasSearchQuery && backlog.length === 0 && !backlogLoading

  useEffect(() => {
    if (isBacklogEmpty && !backlogLoading) {
      setQuickCreateOpen(true)
    }
  }, [isBacklogEmpty, backlogLoading])

  const handleIssueCreated = useCallback((issue: ProjectIssue) => {
    setNewIssueOrder((prev) => [issue.id, ...prev.filter((id) => id !== issue.id)])
    setEnteringIds((prev) => new Set(prev).add(issue.id))
    window.setTimeout(() => {
      setEnteringIds((prev) => {
        const next = new Set(prev)
        next.delete(issue.id)
        return next
      })
    }, ENTER_ANIMATION_MS)
  }, [])

  const handleBeforeDelete = useCallback((ids: string[]) => {
    setExitingIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.add(id)
      return next
    })
    window.setTimeout(() => {
      setExitingIds((prev) => {
        const next = new Set(prev)
        for (const id of ids) next.delete(id)
        return next
      })
    }, EXIT_ANIMATION_MS)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'c' &&
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !event.altKey
      ) {
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        event.preventDefault()
        setQuickCreateOpen(true)
      }
      if (event.key === '/' && !event.metaKey && !event.ctrlKey) {
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  const toggleSelect = (id: string, next?: boolean) => {
    setSelected((prev) => {
      const copy = new Set(prev)
      const shouldSelect = next ?? !copy.has(id)
      if (shouldSelect) copy.add(id)
      else copy.delete(id)
      return copy
    })
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(backlog.map((issue) => issue.id)))
  }

  const dropToSprint = (sprintId: string) => {
    if (!draggingId) return
    setMoveError(null)
    void bulkAssignSprintOptimistic([draggingId], sprintId)
      .then(() => setDraggingId(null))
      .catch((error) => {
        setMoveError(
          error instanceof ApiError ? error.message : 'Failed to move issue to sprint.',
        )
      })
  }

  const openQuickCreate = () => setQuickCreateOpen(true)

  return (
    <main className="page-main">
      <div className="page-stack min-w-0 flex-1">
        <div className={BACKLOG_TOOLBAR}>
          <h2 className="text-base font-semibold text-devflow-text">Backlog</h2>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-devflow-text-muted"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search backlog…"
              aria-label="Search backlog"
              className={cn(
                'w-full rounded-md border border-devflow-border/80 bg-devflow-surface py-1.5 pl-8 pr-3',
                'text-[13px] outline-none placeholder:text-devflow-text-muted',
                'focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/15',
              )}
            />
          </div>

          {!quickCreateOpen ? (
            <BacklogCreateButton
              onClick={openQuickCreate}
              label={
                isBacklogEmpty
                  ? 'Create your first backlog issue'
                  : 'Create issue'
              }
            />
          ) : null}

          <BacklogBulkBar
            projectId={projectId}
            selectedIds={selectedIds}
            onClearSelection={() => setSelected(new Set())}
            onBeforeDelete={handleBeforeDelete}
          />
        </div>

        {backlogError ? (
          <p className="rounded-md border border-devflow-error/30 bg-devflow-error/5 px-2.5 py-1.5 text-[13px] text-devflow-error">
            {backlogError}
          </p>
        ) : null}

        {moveError ? (
          <p className="rounded-md border border-devflow-error/30 bg-devflow-error/5 px-2.5 py-1.5 text-[13px] text-devflow-error">
            {moveError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          <div className={cn(BACKLOG_TABLE_SHELL, 'min-w-0 flex-1')}>
            <div ref={tableScrollRef} className={cn(BACKLOG_TABLE_SCROLL, 'hidden md:block')}>
              <div style={{ minWidth: BACKLOG_TABLE_MIN_WIDTH }}>
                {backlogLoading && isBacklogEmpty ? (
                  <div className="px-2 py-6 text-center text-[13px] text-devflow-text-muted">
                    Loading backlog…
                  </div>
                ) : (
                  <>
                    <BacklogIssueRowHeader
                      allSelected={allSelected}
                      onToggleSelectAll={toggleSelectAll}
                      hasIssues={backlog.length > 0}
                    />

                    <BacklogQuickCreate
                      projectId={projectId}
                      expanded={quickCreateOpen}
                      onExpandedChange={setQuickCreateOpen}
                      onCreated={handleIssueCreated}
                      scrollContainerRef={tableScrollRef}
                    />

                    {isBacklogEmpty && !quickCreateOpen ? (
                      <div className="px-3 py-8 text-center">
                        <p className="text-[13px] font-medium text-devflow-text">
                          You&apos;re all caught up.
                        </p>
                        <div className="mt-2 flex justify-center">
                          <BacklogCreateButton
                            onClick={openQuickCreate}
                            label="Create your first backlog issue"
                          />
                        </div>
                      </div>
                    ) : noSearchResults ? (
                      <div className="px-3 py-5 text-center text-[13px] text-devflow-text-muted">
                        No issues match your search.
                      </div>
                    ) : (
                      backlog.map((issue, index) => (
                        <BacklogIssueRow
                          key={issue.id}
                          issue={issue}
                          projectId={projectId}
                          selected={selected.has(issue.id)}
                          onSelectChange={(next) => toggleSelect(issue.id, next)}
                          onDragStart={setDraggingId}
                          onDragEnd={() => setDraggingId(null)}
                          isLast={index === backlog.length - 1 && !quickCreateOpen}
                          isEntering={enteringIds.has(issue.id)}
                          isExiting={exitingIds.has(issue.id)}
                        />
                      ))
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2 p-2 md:hidden">
              {backlogLoading && isBacklogEmpty ? (
                <div className="py-6 text-center text-[13px] text-devflow-text-muted">
                  Loading backlog…
                </div>
              ) : (
                <>
                  {quickCreateOpen ? (
                    <div className="rounded-md border border-devflow-primary/20 bg-devflow-muted/20 p-2.5">
                      <BacklogQuickCreate
                        projectId={projectId}
                        expanded={quickCreateOpen}
                        onExpandedChange={setQuickCreateOpen}
                        onCreated={handleIssueCreated}
                        variant="stacked"
                      />
                    </div>
                  ) : null}

                  {isBacklogEmpty && !quickCreateOpen ? (
                    <div className="py-6 text-center">
                      <p className="text-[13px] font-medium text-devflow-text">
                        You&apos;re all caught up.
                      </p>
                      <div className="mt-2 flex justify-center">
                        <BacklogCreateButton
                          onClick={openQuickCreate}
                          label="Create your first backlog issue"
                        />
                      </div>
                    </div>
                  ) : noSearchResults ? (
                    <div className="py-5 text-center text-[13px] text-devflow-text-muted">
                      No issues match your search.
                    </div>
                  ) : (
                    backlog.map((issue) => (
                      <BacklogMobileCard
                        key={issue.id}
                        issue={issue}
                        projectId={projectId}
                        selected={selected.has(issue.id)}
                        onSelectChange={(next) => toggleSelect(issue.id, next)}
                        onDragStart={setDraggingId}
                        onDragEnd={() => setDraggingId(null)}
                        isEntering={enteringIds.has(issue.id)}
                        isExiting={exitingIds.has(issue.id)}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          <BacklogSprintSidebar
            projectId={projectId}
            sprints={plannedSprints}
            draggingId={draggingId}
            onDropToSprint={dropToSprint}
          />
        </div>
      </div>
    </main>
  )
}
