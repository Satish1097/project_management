import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderPlus,
  Kanban,
  Plus,
  Rocket,
  Zap,
} from 'lucide-react'
import { useCreateIssue } from '@/contexts/CreateIssueContext'
import { CreateProjectDrawer } from '@/features/projects/CreateProjectDrawer'
import { ROUTES, projectKanbanPath } from '@/constants/routes'
import type { DashboardProjectApi } from '@/types/dashboard'
import { DashboardWidget } from './DashboardWidget'

type QuickCreateWidgetProps = {
  projects: DashboardProjectApi[] | null
}

export function QuickCreateWidget({ projects }: QuickCreateWidgetProps) {
  const { openCreateIssue } = useCreateIssue()
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const firstProject = projects?.[0]

  const actions = [
    {
      id: 'issue',
      label: 'New Issue',
      icon: Plus,
      onClick: () => openCreateIssue(firstProject ? { projectId: firstProject.id } : undefined),
    },
    {
      id: 'project',
      label: 'New Project',
      icon: FolderPlus,
      onClick: () => setCreateProjectOpen(true),
    },
    {
      id: 'sprint',
      label: 'Plan Sprint',
      icon: Rocket,
      to: ROUTES.sprints,
    },
    {
      id: 'board',
      label: 'Open Board',
      icon: Kanban,
      to: firstProject ? projectKanbanPath(firstProject.id) : ROUTES.projects,
    },
  ] as const

  return (
    <>
      <DashboardWidget
        title="Quick Create"
        icon={<Zap className="size-3.5 text-devflow-primary" />}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {actions.map((action) => {
            const Icon = action.icon
            const className =
              'flex items-center gap-2 rounded-md border border-devflow-border bg-devflow-muted/40 px-3 py-2.5 text-left transition-colors hover:bg-devflow-muted'

            if ('to' in action) {
              return (
                <Link key={action.id} to={action.to} className={className}>
                  <Icon className="size-4 shrink-0 text-devflow-text-secondary" />
                  <span className="text-body font-medium text-devflow-text">{action.label}</span>
                </Link>
              )
            }

            return (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className={className}
              >
                <Icon className="size-4 shrink-0 text-devflow-text-secondary" />
                <span className="text-body font-medium text-devflow-text">{action.label}</span>
              </button>
            )
          })}
        </div>
      </DashboardWidget>

      <CreateProjectDrawer
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
      />
    </>
  )
}
