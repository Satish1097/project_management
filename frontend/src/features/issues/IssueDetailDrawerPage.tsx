import { Link, useParams } from 'react-router-dom'
import { Calendar, ChevronDown, MessageSquare, Paperclip, X } from 'lucide-react'
import { TopHeader } from '@/components/layout/TopHeader'
import {
  sprintBoardPath,
  sprintIssueDetailEnhancedPath,
} from '@/constants/routes'
import {
  formatSprintStatus,
  getProjectById,
  getSprintById,
} from '@/services/projectData'
import { IssueStatusBadge } from '@/components/ui/IssueStatusBadge'
import { LabelBadge } from '@/components/ui/LabelBadge'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { AvatarGroup } from '@/components/ui/AvatarGroup'
import { BoardFilters } from '@/features/kanban/BoardFilters'
import { KanbanColumn } from '@/features/kanban/KanbanColumn'
import { kanbanColumns } from '@/services/mockKanban'

const assignees = [
  { name: 'Alex Rivera', color: '#3b82f6' },
  { name: 'Sarah Chen', color: '#8b5cf6' },
  { name: 'Marcus Johnson', color: '#10b981' },
]

export function IssueDetailDrawerPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)

  return (
    <div className="min-h-screen bg-devflow-surface">
      <div className="pointer-events-none opacity-40">
        <TopHeader
          variant="board"
          activeTab="Board"
          projectName={project?.name}
          projectId={projectId}
          sprintName={sprint?.name}
          sprintStatus={sprint ? formatSprintStatus(sprint.status) : undefined}
        />
        <BoardFilters />
        <main className="grid grid-cols-3 gap-4 p-4">
          {kanbanColumns.map((col) => (
            <KanbanColumn key={col.id} column={col} />
          ))}
        </main>
      </div>

      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-devflow-border bg-devflow-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-devflow-border px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-caption text-devflow-text-muted">DF-101</span>
            <IssueStatusBadge status="in_progress" />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={sprintIssueDetailEnhancedPath(projectId, sprintId)}
              className="text-btn text-devflow-primary hover:underline"
            >
              Enhanced view
            </Link>
            <Link
              to={sprintBoardPath(projectId, sprintId)}
              className="rounded-lg p-2 text-devflow-text-secondary hover:bg-devflow-surface"
            >
              <X className="size-5" />
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <h1 className="text-section-title font-semibold text-devflow-text">
            Implement OAuth2 Flow for external partners
          </h1>
          <p className="mt-4 text-body text-devflow-text-secondary">
            Implement Authorization Code flow with PKCE for third-party integrations.
            Includes token refresh, scope management, and audit logging.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-caption-label uppercase text-devflow-text-muted">
                Assignee
              </p>
              <AvatarGroup members={assignees} />
            </div>
            <div>
              <p className="mb-2 text-caption-label uppercase text-devflow-text-muted">
                Labels
              </p>
              <div className="flex gap-2">
                <LabelBadge label="BACKEND" />
                <LabelBadge label="CRITICAL" variant="critical" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-caption-label uppercase text-devflow-text-muted">
                Due Date
              </p>
              <div className="flex items-center gap-2 text-body text-devflow-text-secondary">
                <Calendar className="size-4" />
                Oct 24, 2025
              </div>
            </div>
            <div>
              <p className="mb-2 text-caption-label uppercase text-devflow-text-muted">
                Priority
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-btn text-devflow-error"
              >
                High
                <ChevronDown className="size-3" />
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-4 text-section-title text-devflow-text">Activity</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <UserAvatar name="Sarah Chen" color="#8b5cf6" size={32} />
                <div>
                  <p className="text-body">
                    <span className="font-semibold">Sarah Chen</span> changed status to{' '}
                    <span className="font-semibold">In Progress</span>
                  </p>
                  <p className="text-caption text-devflow-text-muted">2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <UserAvatar name="Alex Rivera" color="#3b82f6" size={32} />
                <div>
                  <p className="text-body">
                    <span className="font-semibold">Alex Rivera</span> added label{' '}
                    <span className="font-semibold">BACKEND</span>
                  </p>
                  <p className="text-caption text-devflow-text-muted">Yesterday</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-devflow-border bg-devflow-surface p-4">
            <textarea
              placeholder="Add a comment..."
              className="min-h-[80px] w-full resize-none bg-transparent text-input outline-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-2 text-devflow-text-secondary">
                <Paperclip className="size-4" />
                <MessageSquare className="size-4" />
              </div>
              <button
                type="button"
                className="rounded-lg bg-devflow-primary px-4 py-1.5 text-btn text-white"
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
