import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PlanningIssueCard } from '@/features/sprints/PlanningIssueCard'
import {
  PlanningBulkBar,
  resolvePlanningSelectionContext,
} from '@/features/sprints/planning/PlanningBulkBar'
import { PlanningQuickCreate } from '@/features/sprints/planning/PlanningQuickCreate'
import { PlanningSection } from '@/features/sprints/planning/PlanningSection'
import { VirtualizedIssueList } from '@/features/sprints/planning/VirtualizedIssueList'
import { useIssues } from '@/contexts/IssuesContext'
import { useSprints } from '@/contexts/SprintsContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useLoadProjectSprints } from '@/hooks/useLoadProjectSprints'
import { useOptimisticIssueActions } from '@/hooks/useOptimisticIssueActions'
import { getProjectById, getSprintById } from '@/services/projectData'
import { getIssueById } from '@/services/issuesRegistry'
import { ApiError } from '@/api/types'
import type { ProjectIssue } from '@/types/issues'
import type { Sprint } from '@/types/sprints'

const BACKLOG_SECTION_ID = 'backlog'

function issueMatchesQuery(issue: ProjectIssue, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    issue.title.toLowerCase().includes(q) ||
    issue.key.toLowerCase().includes(q) ||
    (issue.labels?.some((label) => label.toLowerCase().includes(q)) ?? false)
  )
}

function sortSprintsForPlanning(sprints: Sprint[]): Sprint[] {
  const rank: Record<Sprint['status'], number> = {
    active: 0,
    planned: 1,
    paused: 2,
    completed: 3,
    cancelled: 4,
  }

  return [...sprints].sort((a, b) => {
    const statusDiff = rank[a.status] - rank[b.status]
    if (statusDiff !== 0) return statusDiff
    return a.startDate.localeCompare(b.startDate)
  })
}

function defaultCollapsed(sprint: Sprint): boolean {
  return sprint.status === 'completed' || sprint.status === 'cancelled'
}

export function SprintPlanningPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const currentSprint = getSprintById(projectId, sprintId)
  const { sprints: allSprints, loading: sprintsLoading } = useSprints()
  const { loading: hookSprintsLoading } = useLoadProjectSprints(projectId)
  const {
    issues,
    loadBacklog,
    loadSprintIssues,
    backlogLoading,
    backlogError,
    sprintIssuesError,
  } = useIssues()
  const { bulkAssignSprintOptimistic } = useOptimisticIssueActions(projectId)

  const [query, setQuery] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)
  const [moveError, setMoveError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => new Set())
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(
    BACKLOG_SECTION_ID,
  )
  const searchRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  const projectSprints = useMemo(
    () => sortSprintsForPlanning(allSprints.filter((s) => s.projectId === projectId)),
    [allSprints, projectId],
  )

  const sprintIdsKey = useMemo(
    () => projectSprints.map((s) => s.id).join(','),
    [projectSprints],
  )

  useEffect(() => {
    if (projectId) {
      void loadBacklog(projectId)
    }
  }, [projectId, loadBacklog])

  useEffect(() => {
    if (!projectId || projectSprints.length === 0) return
    void Promise.all(
      projectSprints.map((sprint) => loadSprintIssues(projectId, sprint.id)),
    )
  }, [projectId, sprintIdsKey, loadSprintIssues, projectSprints])

  useEffect(() => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      for (const sprint of projectSprints) {
        const key = `sprint-${sprint.id}`
        if (!prev.has(key) && defaultCollapsed(sprint)) {
          next.add(key)
        }
      }
      return next
    })
  }, [sprintIdsKey, projectSprints])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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

  const issuesBySection = useMemo(() => {
    const backlog = issues.filter(
      (issue) =>
        issue.projectId === projectId &&
        issue.sprintId === null &&
        issueMatchesQuery(issue, query),
    )

    const bySprint = new Map<string, ProjectIssue[]>()
    for (const sprint of projectSprints) {
      bySprint.set(
        sprint.id,
        issues.filter(
          (issue) =>
            issue.projectId === projectId &&
            issue.sprintId === sprint.id &&
            issueMatchesQuery(issue, query),
        ),
      )
    }

    return { backlog, bySprint }
  }, [issues, projectId, projectSprints, query])

  const selectedIds = useMemo(() => [...selected], [selected])
  const selectionContext = useMemo(
    () => resolvePlanningSelectionContext(selectedIds),
    [selectedIds],
  )

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  if ((sprintsLoading || hookSprintsLoading) && !currentSprint && projectSprints.length === 0) {
    return (
      <main className="page-main">
        <p className="text-body text-devflow-text-secondary">Loading planning workspace…</p>
      </main>
    )
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

  const isSectionCollapsed = (sectionKey: string) => {
    if (isMobile) {
      return mobileExpandedSection !== sectionKey
    }
    return collapsedSections.has(sectionKey)
  }

  const toggleSectionCollapse = (sectionKey: string) => {
    if (isMobile) {
      setMobileExpandedSection((prev) => (prev === sectionKey ? null : sectionKey))
      return
    }
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionKey)) next.delete(sectionKey)
      else next.add(sectionKey)
      return next
    })
  }

  const handleDragOver = (sectionKey: string) => (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverSection(sectionKey)
  }

  const handleDragLeave = (sectionKey: string) => (event: React.DragEvent) => {
    const related = event.relatedTarget as Node | null
    if (event.currentTarget.contains(related)) return
    setDragOverSection((prev) => (prev === sectionKey ? null : prev))
  }

  const handleDrop = (targetSprintId: string | null) => (event: React.DragEvent) => {
    event.preventDefault()
    setDragOverSection(null)

    if (!draggingId) return
    const issue = getIssueById(draggingId)
    if (!issue) {
      setDraggingId(null)
      return
    }
    if (issue.sprintId === targetSprintId) {
      setDraggingId(null)
      return
    }

    setMoveError(null)
    void bulkAssignSprintOptimistic([draggingId], targetSprintId)
      .then(() => setDraggingId(null))
      .catch((error) => {
        setMoveError(
          error instanceof ApiError ? error.message : 'Failed to move issue.',
        )
      })
  }

  const renderIssueCard = (issue: ProjectIssue) => (
    <PlanningIssueCard
      issue={issue}
      compact
      inlineEdit
      selectable
      selected={selected.has(issue.id)}
      onSelectChange={(next) => toggleSelect(issue.id, next)}
      onDragStart={setDraggingId}
      onDragEnd={() => {
        setDraggingId(null)
        setDragOverSection(null)
      }}
    />
  )

  const backlogIssues = issuesBySection.backlog
  const isBacklogEmpty = backlogIssues.length === 0 && !backlogLoading
  const hasSearchQuery = query.trim().length > 0

  return (
    <main className="page-main">
      <div className="page-stack min-w-0 flex-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-section-title text-devflow-text">Sprint planning</h2>
            <p className="text-body text-devflow-text-secondary">
              Drag issues between the backlog and sprints to plan your work.
            </p>
          </div>
        </div>

        {moveError ? (
          <p className="rounded-lg border border-devflow-error/30 bg-devflow-danger-bg px-3 py-2 text-caption text-devflow-error">
            {moveError}
          </p>
        ) : null}

        {backlogError ? (
          <p className="rounded-lg border border-devflow-error/30 bg-devflow-danger-bg px-3 py-2 text-caption text-devflow-error">
            {backlogError}
          </p>
        ) : null}

        {sprintIssuesError ? (
          <p className="rounded-lg border border-devflow-error/30 bg-devflow-danger-bg px-3 py-2 text-caption text-devflow-error">
            {sprintIssuesError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-devflow-text-muted" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search backlog and sprints…"
              aria-label="Search planning workspace"
              className="w-full rounded-lg border border-devflow-border bg-devflow-surface py-2 pl-9 pr-3 text-input outline-none focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20"
            />
          </div>

          <PlanningBulkBar
            projectId={projectId}
            selectedIds={selectedIds}
            selectionContext={selectionContext}
            onClearSelection={() => setSelected(new Set())}
            className="sm:flex-1"
          />
        </div>

        <div className="flex flex-col gap-4">
          <PlanningSection
            kind="backlog"
            sectionId={BACKLOG_SECTION_ID}
            title="Backlog"
            issueCount={backlogIssues.length}
            collapsed={isSectionCollapsed(BACKLOG_SECTION_ID)}
            onToggleCollapse={() => toggleSectionCollapse(BACKLOG_SECTION_ID)}
            isDropTarget
            isDragOver={dragOverSection === BACKLOG_SECTION_ID}
            mobileAccordion
            onDragOver={handleDragOver(BACKLOG_SECTION_ID)}
            onDragLeave={handleDragLeave(BACKLOG_SECTION_ID)}
            onDrop={handleDrop(null)}
            isEmpty={isBacklogEmpty}
            emptyState={
              <>
                <p className="text-[13px] font-medium text-devflow-text">
                  {hasSearchQuery ? 'No matching backlog issues' : 'No backlog issues'}
                </p>
                {!hasSearchQuery ? (
                  <p className="mt-1 text-[12px] text-devflow-text-muted">
                    Drop issues here to remove them from a sprint.
                  </p>
                ) : null}
              </>
            }
            footer={<PlanningQuickCreate projectId={projectId} />}
          >
            {backlogLoading && backlogIssues.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-devflow-text-muted">
                Loading backlog…
              </p>
            ) : backlogIssues.length > 0 ? (
              <VirtualizedIssueList
                items={backlogIssues.map((issue) => issue.id)}
                renderItem={(id) => {
                  const issue = getIssueById(id)
                  return issue ? renderIssueCard(issue) : null
                }}
              />
            ) : null}
          </PlanningSection>

          {projectSprints.map((sprint) => {
            const sectionKey = `sprint-${sprint.id}`
            const sprintIssues = issuesBySection.bySprint.get(sprint.id) ?? []
            const isEmpty = sprintIssues.length === 0

            return (
              <PlanningSection
                key={sprint.id}
                kind="sprint"
                sectionId={sectionKey}
                title={sprint.name}
                issueCount={sprintIssues.length}
                collapsed={isSectionCollapsed(sectionKey)}
                onToggleCollapse={() => toggleSectionCollapse(sectionKey)}
                isDropTarget
                isDragOver={dragOverSection === sectionKey}
                highlighted={sprint.id === sprintId}
                sprint={sprint}
                projectId={projectId}
                mobileAccordion
                onDragOver={handleDragOver(sectionKey)}
                onDragLeave={handleDragLeave(sectionKey)}
                onDrop={handleDrop(sprint.id)}
                isEmpty={isEmpty}
                emptyState={
                  <p className="text-[13px] text-devflow-text-muted">
                    {hasSearchQuery
                      ? 'No matching issues in this sprint'
                      : 'Drop issues here to add them to this sprint'}
                  </p>
                }
              >
                {isEmpty ? null : (
                  <VirtualizedIssueList
                    items={sprintIssues.map((issue) => issue.id)}
                    renderItem={(id) => {
                      const issue = getIssueById(id)
                      return issue ? renderIssueCard(issue) : null
                    }}
                  />
                )}
              </PlanningSection>
            )
          })}

          {projectSprints.length === 0 ? (
            <p className="rounded-lg border border-dashed border-devflow-border px-4 py-6 text-center text-[13px] text-devflow-text-muted">
              No sprints yet. Create a sprint from the Sprints page to start planning.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}
