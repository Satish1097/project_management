import { Link, useParams } from 'react-router-dom'
import { cn } from '@/utils/cn'
import {
  formatSprintStatus,
  getSprintsForProject,
} from '@/services/projectData'
import { sprintBoardPath } from '@/constants/routes'

export function ProjectSprintsPage() {
  const { projectId = '' } = useParams()
  const sprints = getSprintsForProject(projectId)

  return (
    <main className="page-main">
      <div className="page-stack max-w-3xl">
        <div>
          <h2 className="text-page-title text-devflow-text">Sprints</h2>
          <p className="text-body text-devflow-text-secondary">
            Select a sprint to open its board, list, or activity views.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {sprints.map((sprint) => (
            <li key={sprint.id}>
              <Link
                to={sprintBoardPath(projectId, sprint.id)}
                className="block rounded-lg border border-devflow-border bg-devflow-card p-4 transition-shadow hover:shadow-devflow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-section-title text-devflow-text">
                      {sprint.name}
                    </h3>
                    <p className="mt-1 text-caption text-devflow-text-secondary">
                      {sprint.dateRange}
                    </p>
                    {sprint.goal && (
                      <p className="mt-2 text-body text-devflow-text-secondary">
                        {sprint.goal}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded px-2 py-0.5 text-caption-label',
                      sprint.status === 'active' &&
                        'bg-[var(--df-success-tint)] text-devflow-success',
                      sprint.status === 'planned' &&
                        'bg-devflow-pill text-devflow-text-secondary',
                      sprint.status === 'completed' &&
                        'bg-devflow-muted text-devflow-text-secondary',
                    )}
                  >
                    {formatSprintStatus(sprint.status)}
                  </span>
                </div>
                <p className="mt-3 font-mono text-caption text-devflow-text-secondary">
                  {sprint.completedCount} of {sprint.issueCount} issues completed
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
