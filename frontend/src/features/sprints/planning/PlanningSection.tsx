import { ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { SprintStatusBadge } from '@/components/ui/SprintStatusBadge'
import type { Sprint } from '@/types/sprints'
import { PlanningSprintMenu } from '@/features/sprints/planning/PlanningSprintMenu'
import { cn } from '@/utils/cn'

export type PlanningSectionKind = 'backlog' | 'sprint'

type PlanningSectionProps = {
  kind: PlanningSectionKind
  sectionId: string
  title: string
  issueCount: number
  collapsed: boolean
  onToggleCollapse: () => void
  isDropTarget: boolean
  isDragOver: boolean
  highlighted?: boolean
  sprint?: Sprint
  projectId?: string
  mobileAccordion?: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  children: ReactNode
  footer?: ReactNode
  emptyState?: ReactNode
  isEmpty: boolean
  onSectionVisible?: () => void
}

export function PlanningSection({
  kind,
  sectionId,
  title,
  issueCount,
  collapsed,
  onToggleCollapse,
  isDropTarget,
  isDragOver,
  highlighted,
  sprint,
  projectId,
  mobileAccordion,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
  footer,
  emptyState,
  isEmpty,
  onSectionVisible,
}: PlanningSectionProps) {
  const showBody = !collapsed
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const node = sectionRef.current
    if (!node || !onSectionVisible || collapsed) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onSectionVisible()
        }
      },
      { root: null, rootMargin: '120px', threshold: 0 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [collapsed, onSectionVisible])

  return (
    <section
      ref={sectionRef}
      data-planning-section={sectionId}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'rounded-lg border bg-devflow-surface transition-colors',
        highlighted
          ? 'border-devflow-primary/40 ring-1 ring-devflow-primary/15'
          : 'border-devflow-border',
        isDragOver && isDropTarget && 'border-devflow-primary bg-[var(--df-nav-tint)]/20',
        mobileAccordion && collapsed && 'md:border-devflow-border',
      )}
    >
      <header
        className={cn(
          'flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-devflow-border/80 px-3 py-2',
          collapsed && 'border-b-0 md:border-b',
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-controls={`planning-section-${sectionId}`}
          className="inline-flex items-center gap-1.5 text-left"
        >
          {collapsed ? (
            <ChevronRight className="size-4 shrink-0 text-devflow-text-muted" />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-devflow-text-muted" />
          )}
          <h3 className="text-[14px] font-semibold text-devflow-text">{title}</h3>
        </button>

        {kind === 'sprint' && sprint ? (
          <>
            <SprintStatusBadge status={sprint.status} />
            <span className="text-[12px] tabular-nums text-devflow-text-muted">
              {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
            </span>
            <span className="text-[12px] text-devflow-text-muted">
              {sprint.dateRange}
            </span>
            {projectId ? (
              <div className="ml-auto">
                <PlanningSprintMenu sprint={sprint} projectId={projectId} />
              </div>
            ) : null}
          </>
        ) : (
          <span className="text-[12px] tabular-nums text-devflow-text-muted">
            {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
          </span>
        )}
      </header>

      {showBody ? (
      <div
        id={`planning-section-${sectionId}`}
        className="px-3 py-2"
      >
        {isEmpty && emptyState ? (
          <div
            className={cn(
              'rounded-md border border-dashed border-devflow-border/80 px-3 py-6 text-center',
              isDragOver && 'border-devflow-primary/50 bg-[var(--df-nav-tint)]/15',
            )}
          >
            {emptyState}
          </div>
        ) : (
          <div className={cn(isDragOver && isEmpty && 'rounded-md ring-1 ring-devflow-primary/25')}>
            {children}
          </div>
        )}

        {footer ? <div className="mt-1 border-t border-devflow-border/60 pt-1">{footer}</div> : null}
      </div>
      ) : null}

      {collapsed && isEmpty && kind === 'backlog' ? (
        <div className="px-3 pb-2 md:hidden">
          <p className="text-[12px] text-devflow-text-muted">
            Drop issues here to remove them from a sprint.
          </p>
        </div>
      ) : null}
    </section>
  )
}
