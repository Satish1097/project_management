import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { projectBoardPath } from '@/constants/routes'
import { BacklogQuickCreate } from '@/components/issues/BacklogQuickCreate'
import { BacklogIssueCard } from '@/features/backlog/BacklogIssueCard'
import { BacklogIssueList } from '@/features/backlog/BacklogIssueList'
import { BACKLOG_SECTION_ID } from '@/features/backlog/backlogSections'
import { defaultSprintCollapsed } from '@/features/backlog/backlogSprintUtils'
import { useProjectBacklog } from '@/features/backlog/useProjectBacklog'
import {
  PlanningBulkBar,
  resolvePlanningSelectionContext,
} from '@/features/sprints/planning/PlanningBulkBar'
import { PlanningSection } from '@/features/sprints/planning/PlanningSection'
import { useSprints } from '@/contexts/SprintsContext'
import { useOptimisticIssueActions } from '@/hooks/useOptimisticIssueActions'
import { useProjectMethodology } from '@/hooks/useProjectMethodology'
import { getProjectById } from '@/services/projectData'
import { getIssueById } from '@/services/issuesRegistry'
import { useIssues } from '@/contexts/IssuesContext'
import { ApiError } from '@/api/types'
import type { ProjectIssue } from '@/types/issues'

const ENTER_ANIMATION_MS = 220
const EXIT_ANIMATION_MS = 200
const SEARCH_DEBOUNCE_MS = 300
const SPRINT_HIGHLIGHT_MS = 1500
const CREATED_ISSUE_HIGHLIGHT_MS = 1200

function resolveSectionIdForSprint(sprintId: string | null): string {
  return sprintId ? `sprint-${sprintId}` : BACKLOG_SECTION_ID
}

export function ProjectBacklogPage() {
  const { projectId = '' } = useParams()
  const { isKanban } = useProjectMethodology(projectId)
  const [searchParams, setSearchParams] = useSearchParams()
  const project = getProjectById(projectId)
  const { recentlyCreatedSprintId } = useSprints()
  const { issues } = useIssues()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)
  const [layoutVersion, setLayoutVersion] = useState(0)
  const [moveError, setMoveError] = useState<string | null>(null)
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set())
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())
  const [highlightedIssueIds, setHighlightedIssueIds] = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => new Set())
  const [highlightedSprintId, setHighlightedSprintId] = useState<string | null>(null)
  const pendingFocusSprintIdRef = useRef<string | null>(null)
  const preserveExpandedSectionsRef = useRef<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  const {
    sections,
    loading,
    error,
    initializeSection,
    loadMoreSection,
    moveIssueBetweenSections,
    rollbackIssueMove,
    appendIssueToSection,
  } = useProjectBacklog(projectId, { search: debouncedQuery, enabled: !!project })

  const { bulkAssignSprintOptimistic } = useOptimisticIssueActions(projectId)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      for (const section of sections) {
        if (section.kind !== 'sprint' || !section.sprint) continue
        const key = section.sectionId
        if (
          !prev.has(key) &&
          defaultSprintCollapsed(section.sprint) &&
          !preserveExpandedSectionsRef.current.has(key)
        ) {
          next.add(key)
        }
      }
      return next
    })
  }, [sections])

  useEffect(() => {
    const sprintId = searchParams.get('sprint')
    if (!sprintId) return

    pendingFocusSprintIdRef.current = sprintId
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('sprint')
        return next
      },
      { replace: true },
    )
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const sprintId = pendingFocusSprintIdRef.current
    if (!sprintId) return

    const section = sections.find((item) => item.sprint?.id === sprintId)
    if (!section) {
      if (!loading) pendingFocusSprintIdRef.current = null
      return
    }

    const sectionId = section.sectionId
    pendingFocusSprintIdRef.current = null
    preserveExpandedSectionsRef.current.add(sectionId)

    setCollapsedSections((prev) => {
      if (!prev.has(sectionId)) return prev
      const next = new Set(prev)
      next.delete(sectionId)
      return next
    })
    initializeSection(sectionId)
    setHighlightedSprintId(sprintId)

    requestAnimationFrame(() => {
      document
        .querySelector(`[data-planning-section="${sectionId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })

    const timer = window.setTimeout(() => {
      setHighlightedSprintId(null)
    }, SPRINT_HIGHLIGHT_MS)

    return () => window.clearTimeout(timer)
  }, [sections, loading, initializeSection])

  useEffect(() => {
    if (!recentlyCreatedSprintId) return
    const el = document.querySelector(
      `[data-planning-section="sprint-${recentlyCreatedSprintId}"]`,
    )
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [recentlyCreatedSprintId])

  const selectedIds = useMemo(() => [...selected], [selected])
  const selectionContext = useMemo(
    () => resolvePlanningSelectionContext(selectedIds),
    [selectedIds],
  )

  const handleIssueCreated = useCallback(
    (issue: ProjectIssue) => {
      const targetSectionId = resolveSectionIdForSprint(issue.sprintId)
      appendIssueToSection(targetSectionId, issue)
      setEnteringIds((prev) => new Set(prev).add(issue.id))
      setHighlightedIssueIds((prev) => new Set(prev).add(issue.id))
      window.setTimeout(() => {
        setEnteringIds((prev) => {
          const next = new Set(prev)
          next.delete(issue.id)
          return next
        })
      }, ENTER_ANIMATION_MS)
      window.setTimeout(() => {
        setHighlightedIssueIds((prev) => {
          const next = new Set(prev)
          next.delete(issue.id)
          return next
        })
      }, CREATED_ISSUE_HIGHLIGHT_MS)
    },
    [appendIssueToSection],
  )

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

  useEffect(() => {
    for (const section of sections) {
      if (!collapsedSections.has(section.sectionId)) {
        initializeSection(section.sectionId)
      }
    }
  }, [debouncedQuery, sections, collapsedSections, initializeSection])

  useEffect(() => {
    const relocations = new Map<
      string,
      { issue: ProjectIssue; sourceSectionId: string; targetSectionId: string }
    >()

    for (const section of sections) {
      for (const sectionIssue of section.issues) {
        const issue = getIssueById(sectionIssue.id) ?? sectionIssue
        const sourceSectionId = section.sectionId
        const targetSectionId = resolveSectionIdForSprint(issue.sprintId)

        if (sourceSectionId === targetSectionId) continue
        if (relocations.has(issue.id)) continue

        relocations.set(issue.id, { issue, sourceSectionId, targetSectionId })
      }
    }

    if (relocations.size === 0) return

    for (const { issue, sourceSectionId, targetSectionId } of relocations.values()) {
      moveIssueBetweenSections(issue.id, sourceSectionId, targetSectionId, issue)
    }
  }, [issues, sections, moveIssueBetweenSections])

  const handleSectionVisible = useCallback(
    (sectionKey: string) => {
      if (collapsedSections.has(sectionKey)) return
      initializeSection(sectionKey)
    },
    [collapsedSections, initializeSection],
  )

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  if (isKanban) {
    return <Navigate to={projectBoardPath(projectId)} replace />
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

  const toggleSectionCollapse = (sectionKey: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      const willExpand = next.has(sectionKey)
      if (willExpand) next.delete(sectionKey)
      else next.add(sectionKey)
      if (willExpand) {
        initializeSection(sectionKey)
      }
      return next
    })
    // Force backlog list virtualization to refresh offset/height after layout changes.
    setLayoutVersion((prev) => prev + 1)
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

    const sourceSectionId = resolveSectionIdForSprint(issue.sprintId)
    const targetSectionId = resolveSectionIdForSprint(targetSprintId)

    if (sourceSectionId === targetSectionId) {
      setDraggingId(null)
      return
    }

    const snapshot = { ...issue }
    setMoveError(null)
    moveIssueBetweenSections(draggingId, sourceSectionId, targetSectionId, issue)

    void bulkAssignSprintOptimistic([draggingId], targetSprintId)
      .then(() => setDraggingId(null))
      .catch((dropError) => {
        rollbackIssueMove(draggingId, sourceSectionId, targetSectionId, snapshot)
        setMoveError(
          dropError instanceof ApiError ? dropError.message : 'Failed to move issue.',
        )
      })
  }

  const renderIssueCard = (issue: ProjectIssue) => (
    <BacklogIssueCard
      issue={issue}
      projectId={projectId}
      selected={selected.has(issue.id)}
      onSelectChange={(next) => toggleSelect(issue.id, next)}
      onDragStart={setDraggingId}
      onDragEnd={() => {
        setDraggingId(null)
        setDragOverSection(null)
      }}
      isEntering={enteringIds.has(issue.id)}
      isExiting={exitingIds.has(issue.id)}
      isHighlighted={highlightedIssueIds.has(issue.id)}
    />
  )

  const hasSearchQuery = query.trim().length > 0
  const sprintSections = sections.filter((section) => section.kind === 'sprint')

  return (
    <main className="page-main">
      <div className="page-stack min-w-0 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-devflow-text">Backlog</h2>

          <div className="relative max-w-md flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-devflow-text-muted"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search backlog and sprints…"
              aria-label="Search backlog and sprints"
              className="w-full rounded-md border border-devflow-border/80 bg-devflow-surface py-1.5 pl-8 pr-3 text-[13px] outline-none placeholder:text-devflow-text-muted focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/15"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-md border border-devflow-error/30 bg-devflow-error/5 px-2.5 py-1.5 text-[13px] text-devflow-error">
            {error}
          </p>
        ) : null}

        {moveError ? (
          <p className="rounded-md border border-devflow-error/30 bg-devflow-error/5 px-2.5 py-1.5 text-[13px] text-devflow-error">
            {moveError}
          </p>
        ) : null}

        <PlanningBulkBar
          projectId={projectId}
          selectedIds={selectedIds}
          selectionContext={selectionContext}
          onClearSelection={() => setSelected(new Set())}
          onBeforeDelete={handleBeforeDelete}
        />

        <div className="flex min-w-0 flex-col gap-4">
          {sections.map((section) => {
            const collapsed = collapsedSections.has(section.sectionId)
            const isBacklog = section.kind === 'backlog'
            const isEmpty =
              section.issueCount === 0 &&
              (section.pagination.initialized || !section.pagination.loading)
            const showInitialLoading =
              !collapsed &&
              section.pagination.loading &&
              section.issues.length === 0 &&
              section.issueCount > 0

            return (
              <PlanningSection
                key={section.sectionId}
                kind={section.kind}
                sectionId={section.sectionId}
                title={section.title}
                issueCount={section.issueCount}
                collapsed={collapsed}
                onToggleCollapse={() => toggleSectionCollapse(section.sectionId)}
                onSectionVisible={() => handleSectionVisible(section.sectionId)}
                isDropTarget
                isDragOver={dragOverSection === section.sectionId}
                highlighted={
                  section.sprint != null &&
                  (recentlyCreatedSprintId === section.sprint.id ||
                    highlightedSprintId === section.sprint.id)
                }
                sprint={section.sprint}
                projectId={projectId}
                onDragOver={handleDragOver(section.sectionId)}
                onDragLeave={handleDragLeave(section.sectionId)}
                onDrop={handleDrop(section.sprint?.id ?? null)}
                isEmpty={isEmpty}
                emptyState={
                  isBacklog ? (
                    <>
                      <p className="text-[13px] font-medium text-devflow-text">
                        {hasSearchQuery
                          ? 'No matching backlog issues'
                          : loading
                            ? 'Loading backlog…'
                            : 'No backlog issues yet'}
                      </p>
                      {!hasSearchQuery && !loading ? (
                        <p className="mt-1 text-[12px] text-devflow-text-muted">
                          Create an issue below or drop issues here from a sprint.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-[13px] text-devflow-text-muted">
                      {hasSearchQuery
                        ? 'No matching issues in this sprint'
                        : 'Drop issues here to add them to this sprint'}
                    </p>
                  )
                }
                footer={
                  isBacklog ? (
                    <BacklogQuickCreate
                      projectId={projectId}
                      expanded
                      onExpandedChange={() => {}}
                      onCreated={handleIssueCreated}
                      variant="inline"
                    />
                  ) : undefined
                }
              >
                {showInitialLoading ? (
                  <p className="py-4 text-center text-[13px] text-devflow-text-muted">
                    Loading issues…
                  </p>
                ) : collapsed || section.issues.length === 0 ? null : (
                  <BacklogIssueList
                    items={section.issues.map((issue) => issue.id)}
                    layoutVersion={layoutVersion}
                    hasNext={section.pagination.hasNext}
                    loadingMore={section.pagination.loading}
                    onLoadMore={() => loadMoreSection(section.sectionId)}
                    renderItem={(id) => {
                      const issue = getIssueById(id)
                      return issue ? renderIssueCard(issue) : null
                    }}
                  />
                )}
              </PlanningSection>
            )
          })}

          {!loading && sprintSections.length === 0 ? (
            <p className="rounded-lg border border-dashed border-devflow-border px-4 py-6 text-center text-[13px] text-devflow-text-muted">
              No sprints yet. Create a sprint from the Sprints page to organize your
              backlog.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}
