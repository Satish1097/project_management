import { Link } from 'react-router-dom'
import {
  ArrowRight,
  FileText,
  FolderKanban,
  Search,
  User,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useIssueDetail } from '@/contexts/IssueDetailContext'

const results = [
  {
    id: '1',
    type: 'issue',
    key: 'DF-101',
    title: 'Implement OAuth2 Flow for external partners',
    meta: 'In Progress · Mobile App',
  },
  {
    id: '2',
    type: 'issue',
    key: 'DF-1085',
    title: 'Fix race condition in CI/CD pipeline',
    meta: 'Todo · Devops',
  },
  {
    id: '3',
    type: 'project',
    key: '',
    title: 'Infrastructure Modernization',
    meta: '12 open issues',
  },
  {
    id: '4',
    type: 'user',
    key: '',
    title: 'Sarah Chen',
    meta: 'Engineering · Admin',
  },
]

const typeIcons = {
  issue: FileText,
  project: FolderKanban,
  user: User,
}

export function GlobalSearchPage() {
  const { openIssueDetail } = useIssueDetail()

  return (
    <div className="relative min-h-screen bg-devflow-muted">
      <div className="p-4 opacity-40">
        <h1 className="text-page-title text-devflow-text">Dashboard</h1>
      </div>

      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]">
        <div className="w-full max-w-xl overflow-hidden rounded-lg border border-devflow-border bg-devflow-card shadow-2xl">
          <div className="flex items-center gap-3 border-b border-devflow-border px-4 py-3">
            <Search className="size-5 text-devflow-text-muted" />
            <input
              type="search"
              autoFocus
              defaultValue="oauth"
              placeholder="Search issues, projects, people..."
              className="flex-1 bg-transparent text-input outline-none"
            />
            <kbd className="rounded bg-devflow-subtle px-2 py-0.5 text-caption text-devflow-text-secondary">
              ESC
            </kbd>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-2">
            <p className="px-3 py-2 text-table-header uppercase tracking-wide text-devflow-text-muted">
              Issues
            </p>
            {results.map((item) => {
              const Icon = typeIcons[item.type as keyof typeof typeIcons]
              const className =
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-devflow-surface'

              if (item.type === 'issue') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      item.key
                        ? openIssueDetail({ issueKey: item.key })
                        : undefined
                    }
                    className={className}
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-devflow-muted">
                      <Icon className="size-4 text-devflow-text-secondary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {item.key && (
                          <span className="font-mono text-caption text-devflow-text-muted">
                            {item.key}
                          </span>
                        )}
                        <span className="truncate text-body font-medium text-devflow-text">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-caption text-devflow-text-muted">{item.meta}</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-devflow-text-muted" />
                  </button>
                )
              }

              return (
                <Link
                  key={item.id}
                  to={ROUTES.dashboard}
                  className={className}
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-devflow-muted">
                    <Icon className="size-4 text-devflow-text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {item.key && (
                        <span className="font-mono text-caption text-devflow-text-muted">
                          {item.key}
                        </span>
                      )}
                      <span className="truncate text-body font-medium text-devflow-text">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-caption text-devflow-text-muted">{item.meta}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-devflow-text-muted" />
                </Link>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t border-devflow-border bg-devflow-surface px-4 py-2 text-caption text-devflow-text-muted">
            <span>↑↓ navigate · ↵ select</span>
            <Link to={ROUTES.dashboard} className="hover:text-devflow-brand">
              Close search
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
