import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PlanningIssueCard } from '@/features/sprints/PlanningIssueCard'
import { useIssues } from '@/contexts/IssuesContext'
import { getProjectById, getSprintById } from '@/services/projectData'
import { SprintStatusBadge } from '@/components/ui/SprintStatusBadge'

export function SprintPlanningPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)
  const { issues, assignToSprint } = useIssues()
  const [query, setQuery] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const backlog = useMemo(() => {
    const q = query.trim().toLowerCase()
    return issues.filter((i) => {
      if (i.projectId !== projectId || i.sprintId !== null) return false
      if (!q) return true
      return (
        i.title.toLowerCase().includes(q) ||
        i.key.toLowerCase().includes(q)
      )
    })
  }, [issues, projectId, query])

  const sprintIssues = useMemo(() => {
    const q = query.trim().toLowerCase()
    return issues.filter((i) => {
      if (i.projectId !== projectId || i.sprintId !== sprintId) return false
      if (!q) return true
      return (
        i.title.toLowerCase().includes(q) ||
        i.key.toLowerCase().includes(q)
      )
    })
  }, [issues, projectId, sprintId, query])

  if (!project || !sprint) {
    return <Navigate to="/projects" replace />
  }

  const dropToSprint = (issueId: string) => {
    assignToSprint(issueId, sprintId)
    setDraggingId(null)
  }

  const dropToBacklog = (issueId: string) => {
    assignToSprint(issueId, null)
    setDraggingId(null)
  }

  return (
    <main className="page-main">
      <div className="page-stack min-w-0 flex-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-section-title text-devflow-text">
              Sprint planning
            </h2>
            <p className="text-body text-devflow-text-secondary">
              Drag issues from backlog into {sprint.name}.
            </p>
          </div>
          <SprintStatusBadge status={sprint.status} />
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-devflow-text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search backlog and sprint issues…"
            className="w-full rounded-lg border border-devflow-border bg-devflow-surface py-2 pl-9 pr-3 text-input outline-none focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20"
          />
        </div>

        <div className="grid min-h-[24rem] grid-cols-1 gap-4 lg:grid-cols-2">
          <PlanningColumn
            title="Backlog tickets"
            count={backlog.length}
            emptyLabel="Backlog is empty"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (draggingId) dropToBacklog(draggingId)
            }}
          >
            {backlog.map((issue) => (
              <PlanningIssueCard
                key={issue.id}
                issue={issue}
                onDragStart={setDraggingId}
                onDragEnd={() => setDraggingId(null)}
              />
            ))}
          </PlanningColumn>

          <PlanningColumn
            title={sprint.name}
            count={sprintIssues.length}
            emptyLabel="Drop tickets here"
            highlight
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (draggingId) dropToSprint(draggingId)
            }}
          >
            {sprintIssues.map((issue) => (
              <PlanningIssueCard
                key={issue.id}
                issue={issue}
                onDragStart={setDraggingId}
                onDragEnd={() => setDraggingId(null)}
              />
            ))}
          </PlanningColumn>
        </div>
      </div>
    </main>
  )
}

function PlanningColumn({
  title,
  count,
  emptyLabel,
  highlight,
  children,
  onDragOver,
  onDrop,
}: {
  title: string
  count: number
  emptyLabel: string
  highlight?: boolean
  children: React.ReactNode
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}) {
  const hasChildren = Array.isArray(children)
    ? (children as React.ReactElement[]).length > 0
    : Boolean(children)

  return (
    <section
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={
        highlight
          ? 'flex flex-col rounded-lg border-2 border-dashed border-devflow-primary/40 bg-[var(--df-nav-tint)]/30 p-3'
          : 'flex flex-col rounded-lg border border-devflow-border bg-devflow-surface p-3'
      }
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-section-title text-devflow-text">{title}</h3>
        <span className="rounded-full bg-devflow-pill px-2 py-0.5 text-caption text-devflow-text-secondary">
          {count}
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-2">
        {hasChildren ? children : (
          <p className="py-8 text-center text-caption text-devflow-text-muted">
            {emptyLabel}
          </p>
        )}
      </div>
    </section>
  )
}
