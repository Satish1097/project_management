import { Filter, Download, AlertTriangle } from 'lucide-react'
import { BRANDING } from '@/constants/branding'
import { IssueStatusBadge } from '@/components/ui/IssueStatusBadge'
import { LabelBadge } from '@/components/ui/LabelBadge'
import { PriorityIndicator } from '@/components/ui/PriorityIndicator'
import { layout } from '@/constants/layout'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/utils/cn'
import type { TaskPriority } from '@/types/tasks'

const qaBugs = [
  {
    id: '1',
    key: 'DF-301',
    title: 'Login redirect loop on Safari 17',
    priority: 'high' as TaskPriority,
    status: 'in_progress' as const,
    severity: 'P1',
  },
  {
    id: '2',
    key: 'DF-302',
    title: 'Export CSV truncates UTF-8 characters',
    priority: 'medium' as TaskPriority,
    status: 'todo' as const,
    severity: 'P2',
  },
  {
    id: '3',
    key: 'DF-303',
    title: 'Mobile nav overlap on tablet viewport',
    priority: 'low' as TaskPriority,
    status: 'backlog' as const,
    severity: 'P3',
  },
]

const tabs = ['All Tasks', 'Ready for QA (8)', 'In Progress (3)', 'Failed (2)', 'Passed (45)']

export function QAManagementPage() {
  return (
    <div className="flex min-h-screen flex-col bg-devflow-surface">
      <header className={cn(layout.appHeader, 'header-glass')}>
        <span className="text-brand text-devflow-brand">{BRANDING.qaName}</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            className="rounded-lg bg-devflow-brand-deep px-3 py-1.5 text-btn text-white"
          >
            Deploy
          </button>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-section-title text-devflow-text">
              QA Lifecycle Management
            </h1>
            <p className="text-body text-devflow-text-secondary">
              Tracking 58 active tickets in Sprint #42
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-devflow-border bg-devflow-card px-4 py-2 text-btn"
            >
              <Filter className="size-3" />
              Filter
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-devflow-border bg-devflow-card px-4 py-2 text-btn"
            >
              <Download className="size-3" />
              Export
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-4 border-b border-devflow-border">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={
                i === 3
                  ? 'border-b-2 border-devflow-brand pb-3 text-btn text-devflow-brand'
                  : 'pb-3 text-body text-devflow-text-secondary'
              }
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-devflow-border bg-devflow-card shadow-sm">
          <div className="grid grid-cols-[48px_100px_1fr_100px_120px_80px] gap-4 border-b border-devflow-border bg-devflow-table-header px-4 py-2 text-table-header uppercase tracking-wide text-devflow-text-secondary">
            <span />
            <span>ID</span>
            <span>Title</span>
            <span>Status</span>
            <span>Severity</span>
            <span />
          </div>
          {qaBugs.map((bug, i) => (
            <div
              key={bug.id}
              className={`grid grid-cols-[48px_100px_1fr_100px_120px_80px] items-center gap-4 px-4 py-3 ${
                i < qaBugs.length - 1 ? 'border-b border-devflow-border' : ''
              }`}
            >
              <PriorityIndicator priority={bug.priority} />
              <span className="font-mono text-caption text-devflow-text-muted">
                {bug.key}
              </span>
              <span className="font-semibold text-devflow-text">{bug.title}</span>
              <IssueStatusBadge status={bug.status} />
              <LabelBadge
                label={bug.severity}
                variant={bug.severity === 'P1' ? 'critical' : 'default'}
              />
              <AlertTriangle
                className={`size-4 justify-self-end ${
                  bug.severity === 'P1' ? 'text-devflow-error' : 'text-devflow-text-muted'
                }`}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
