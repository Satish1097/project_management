import { Link } from 'react-router-dom'
import {
  Calendar,
  ChevronDown,
  GitBranch,
  Link2,
  ListChecks,
  Paperclip,
  X,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { IssueStatusBadge } from '@/components/ui/IssueStatusBadge'
import { LabelBadge } from '@/components/ui/LabelBadge'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { Avatar } from '@/components/ui/Avatar'

const subtasks = [
  { id: '1', title: 'Define OAuth scopes', done: true },
  { id: '2', title: 'Implement token exchange endpoint', done: true },
  { id: '3', title: 'Add PKCE validation middleware', done: false },
  { id: '4', title: 'Write integration tests', done: false },
]

const linkedIssues = [
  { key: 'DF-98', title: 'API Gateway rate limiting' },
  { key: 'DF-104', title: 'Security audit for auth module' },
]

export function EnhancedIssueDrawerPage() {
  const completed = subtasks.filter((t) => t.done).length

  return (
    <div className="min-h-screen bg-black/30">
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl bg-white shadow-2xl">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-devflow-border px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-caption text-devflow-text-muted">DF-101</span>
              <IssueStatusBadge status="in_progress" />
              <PriorityBadge priority="high" />
            </div>
            <Link
              to={ROUTES.issueDetail}
              className="rounded-lg p-2 hover:bg-devflow-surface"
            >
              <X className="size-5" />
            </Link>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <h1 className="text-section-title font-semibold text-devflow-text">
                Implement OAuth2 Flow for external partners
              </h1>
              <p className="mt-4 text-body text-devflow-text-secondary">
                Full Authorization Code + PKCE implementation for partner integrations
                with refresh tokens, scope UI, and compliance audit trail.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <LabelBadge label="BACKEND" />
                <LabelBadge label="SECURITY" />
                <LabelBadge label="CRITICAL" variant="critical" />
              </div>

              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-card-title">
                    <ListChecks className="size-5" />
                    Subtasks
                  </h3>
                  <span className="text-body text-devflow-text-secondary">
                    {completed}/{subtasks.length}
                  </span>
                </div>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#eceef0]">
                  <div
                    className="h-full bg-devflow-primary"
                    style={{ width: `${(completed / subtasks.length) * 100}%` }}
                  />
                </div>
                <ul className="space-y-2">
                  {subtasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg border border-devflow-border px-3 py-2"
                    >
                      <input type="checkbox" checked={task.done} readOnly />
                      <span
                        className={
                          task.done
                            ? 'text-caption text-devflow-text-muted line-through'
                            : 'text-body text-devflow-text'
                        }
                      >
                        {task.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <h3 className="mb-3 flex items-center gap-2 text-card-title">
                  <Link2 className="size-5" />
                  Linked Issues
                </h3>
                <ul className="space-y-2">
                  {linkedIssues.map((issue) => (
                    <li
                      key={issue.key}
                      className="flex items-center gap-3 rounded-lg bg-devflow-surface px-3 py-2"
                    >
                      <span className="font-mono text-caption text-devflow-text-muted">
                        {issue.key}
                      </span>
                      <span className="text-body text-devflow-text">{issue.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="w-56 shrink-0 overflow-y-auto border-l border-devflow-border bg-[#f7f9fb] p-3">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-caption-label text-devflow-text-muted">
                    Status
                  </p>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-devflow-border bg-white px-3 py-2 text-input"
                  >
                    In Progress
                    <ChevronDown className="size-4" />
                  </button>
                </div>
                <div>
                  <p className="mb-2 text-caption-label text-devflow-text-muted">
                    Assignee
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-devflow-border bg-white px-3 py-2">
                    <Avatar name="Sarah Chen" color="#8b5cf6" size={24} />
                    <span className="text-input">Sarah Chen</span>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-caption-label text-devflow-text-muted">
                    Due Date
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-devflow-border bg-white px-3 py-2 text-input">
                    <Calendar className="size-4" />
                    Oct 24, 2025
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-caption-label text-devflow-text-muted">
                    Sprint
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-devflow-border bg-white px-3 py-2 text-input">
                    <GitBranch className="size-4" />
                    Sprint 42
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-caption-label text-devflow-text-muted">
                    Attachments
                  </p>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg border border-dashed border-devflow-border px-3 py-3 text-body text-devflow-text-secondary"
                  >
                    <Paperclip className="size-4" />
                    Add file
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
