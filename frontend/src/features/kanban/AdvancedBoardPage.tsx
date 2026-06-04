import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { BRANDING } from '@/constants/branding'
import { layout } from '@/constants/layout'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { KanbanColumn } from './KanbanColumn'
import type { KanbanColumn as KanbanColumnType } from '@/types/kanban'

const advancedColumns: KanbanColumnType[] = [
  {
    id: 'todo',
    title: 'TODO',
    dotColor: '#727785',
    count: 1,
    issues: [
      {
        id: 'a1',
        key: 'DF-201',
        title: 'Migrate auth service to OIDC',
        priority: 'high',
        label: 'Backend',
        assignee: { name: 'Alex', color: '#6366f1' },
      },
    ],
  },
  {
    id: 'in_review',
    title: 'IN REVIEW',
    dotColor: '#b45309',
    count: 2,
    issues: [
      {
        id: 'a2',
        key: 'DF-198',
        title: 'GraphQL schema versioning',
        priority: 'medium',
        label: 'API',
        assignee: { name: 'Sarah', color: '#8b5cf6' },
        progress: 90,
      },
    ],
  },
  {
    id: 'in_progress',
    title: 'IN PROGRESS',
    dotColor: '#0058be',
    count: 3,
    issues: [
      {
        id: 'a3',
        key: 'DF-195',
        title: 'Kubernetes pod autoscaling rules',
        priority: 'high',
        label: 'Infra',
        assignee: { name: 'Marcus', color: '#10b981' },
        progress: 45,
      },
    ],
  },
  {
    id: 'done',
    title: 'DONE',
    dotColor: '#10b981',
    count: 8,
    issues: [
      {
        id: 'a4',
        key: 'DF-190',
        title: 'Redis cluster failover test',
        label: 'Reliability',
        assignee: { name: 'Luna', color: '#ec4899' },
        done: true,
      },
    ],
  },
  {
    id: 'blocked',
    title: 'BLOCKED',
    dotColor: '#ba1a1a',
    count: 0,
    issues: [],
  },
]

export function AdvancedBoardPage() {
  return (
    <div className="min-h-screen bg-devflow-surface">
      <header className={cn(layout.appHeader, 'bg-devflow-card')}>
        <div className="flex items-center gap-4">
          <span className="text-brand text-devflow-text">{BRANDING.appName}</span>
          <span className="text-devflow-text-secondary">|</span>
          <span className="font-medium text-devflow-text-secondary">
            Advanced Engineering Board
          </span>
        </div>
        <Link
          to={ROUTES.board}
          className="text-btn text-devflow-primary hover:underline"
        >
          Standard board
        </Link>
      </header>
      <div className="flex gap-3 border-b border-devflow-border bg-devflow-card px-4 py-2">
        {['All Teams', 'Backend', 'Frontend', 'Platform'].map((f, i) => (
          <button
            key={f}
            type="button"
            className={
              i === 0
                ? 'rounded-lg bg-devflow-nav-active-alt px-3 py-1.5 text-btn text-devflow-nav-active-text-alt'
                : 'px-3 py-1.5 text-body text-devflow-text-secondary'
            }
          >
            {f}
          </button>
        ))}
      </div>
      <main className="overflow-x-auto p-4">
        <div className="flex min-w-max gap-4">
          {advancedColumns.map((column) => (
            <div key={column.id} className="w-72 shrink-0">
              {column.count === 0 && column.id === 'blocked' ? (
                <div className="rounded-lg border border-dashed border-devflow-border bg-devflow-card/60 p-5 text-center">
                  <p className="text-table-header uppercase text-devflow-text-muted">
                    BLOCKED (0)
                  </p>
                  <p className="mt-2 text-body text-devflow-text-secondary">
                    No blocked issues
                  </p>
                </div>
              ) : (
                <KanbanColumn column={column} />
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="fixed bottom-10 right-6 flex size-14 items-center justify-center rounded-full bg-devflow-brand-deep text-white shadow-lg"
        >
          <Plus className="size-5" />
        </button>
      </main>
    </div>
  )
}
