import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PlanningIssueCard } from '@/features/sprints/PlanningIssueCard'
import { useIssues } from '@/contexts/IssuesContext'
import { getProjectById, getSprintsForProject } from '@/services/projectData'
import { sprintPlanningPath } from '@/constants/routes'
import { SelectField } from '@/components/ui/SelectField'

export function ProjectBacklogPage() {
  const { projectId = '' } = useParams()
  const project = getProjectById(projectId)
  const { issues, assignToSprint } = useIssues()
  const [query, setQuery] = useState('')
  const [targetSprintId, setTargetSprintId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const plannedSprints = getSprintsForProject(projectId).filter(
    (s) => s.status === 'planned' || s.status === 'active',
  )

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

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addSelectedToSprint = () => {
    if (!targetSprintId) return
    for (const id of selected) {
      assignToSprint(id, targetSprintId)
    }
    setSelected(new Set())
  }

  const dropToSprint = (sprintId: string) => {
    if (draggingId) {
      assignToSprint(draggingId, sprintId)
      setDraggingId(null)
    }
  }

  return (
    <main className="page-main">
      <div className="page-stack min-w-0 flex-1">
        <div>
          <h2 className="text-lg font-semibold text-devflow-text">Backlog</h2>
          <p className="mt-0.5 text-body text-devflow-text-secondary">
            Unscheduled work — assign tickets to a sprint when ready.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-devflow-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search backlog…"
              className="w-full rounded-lg border border-devflow-border bg-devflow-surface py-2 pl-9 pr-3 text-input outline-none focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20"
            />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <SelectField
              label="Add to sprint"
              className="min-w-[12rem]"
              value={targetSprintId}
              options={[
                { value: '', label: 'Select sprint…' },
                ...plannedSprints.map((s) => ({
                  value: s.id,
                  label: s.name,
                })),
              ]}
              onChange={(e) => setTargetSprintId(e.target.value)}
            />
            <button
              type="button"
              disabled={!targetSprintId || selected.size === 0}
              onClick={addSelectedToSprint}
              className="rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white disabled:opacity-50"
            >
              Add selected ({selected.size})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ul className="flex flex-col gap-2">
              {backlog.map((issue) => (
                <li key={issue.id} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(issue.id)}
                    onChange={() => toggleSelect(issue.id)}
                    className="mt-3 size-4 accent-devflow-primary"
                    aria-label={`Select ${issue.key}`}
                  />
                  <div className="min-w-0 flex-1">
                    <PlanningIssueCard
                      issue={issue}
                      onDragStart={setDraggingId}
                      onDragEnd={() => setDraggingId(null)}
                    />
                  </div>
                </li>
              ))}
              {backlog.length === 0 && (
                <li className="rounded-lg border border-dashed border-devflow-border py-12 text-center text-body text-devflow-text-muted">
                  No backlog items. All tickets are assigned to sprints.
                </li>
              )}
            </ul>
          </div>

          <aside className="flex flex-col gap-2">
            <h3 className="text-section-title text-devflow-text">
              Drop onto sprint
            </h3>
            {plannedSprints.map((sprint) => (
              <div
                key={sprint.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  dropToSprint(sprint.id)
                }}
                className="rounded-lg border border-dashed border-devflow-border bg-devflow-card p-3 transition-colors hover:border-devflow-primary/50 hover:bg-[var(--df-nav-tint)]/20"
              >
                <p className="text-body font-medium text-devflow-text">
                  {sprint.name}
                </p>
                <p className="text-caption text-devflow-text-muted">
                  {sprint.issueCount} issues
                </p>
                <Link
                  to={sprintPlanningPath(projectId, sprint.id)}
                  className="mt-2 inline-block text-caption text-devflow-primary hover:underline"
                >
                  Open planning →
                </Link>
              </div>
            ))}
            {plannedSprints.length === 0 && (
              <p className="text-caption text-devflow-text-muted">
                Create a sprint to assign backlog items.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
