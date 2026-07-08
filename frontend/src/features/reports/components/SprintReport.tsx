import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircle2,
  Circle,
  PlusCircle,
  MinusCircle,
  ArrowRightCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react'
import { getSprintReport, type SprintReportApi, type SprintReportIssue } from '@/api/reports'
import { useReportsFilter } from '@/features/reports/contexts/ReportsFilterContext'
import { layout } from '@/constants/layout'
import { getProjectSprints, type SprintSummaryApi } from '@/api/sprints'

// ── Priority & Type badges ──────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-orange-500/15 text-orange-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  low: 'bg-blue-500/15 text-blue-400',
}

const TYPE_COLORS: Record<string, string> = {
  story: 'bg-green-500/15 text-green-400',
  bug: 'bg-red-500/15 text-red-400',
  task: 'bg-blue-500/15 text-blue-400',
  epic: 'bg-purple-500/15 text-purple-400',
  subtask: 'bg-teal-500/15 text-teal-400',
}

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${colorClass}`}
    >
      {label}
    </span>
  )
}

// ── Summary Card ────────────────────────────────────────────────────

function SummaryCard({
  label,
  issues,
  points,
  icon: Icon,
  accent,
}: {
  label: string
  issues: number
  points: number
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="rounded-lg border border-devflow-border bg-devflow-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${accent}`} />
        <span className="text-caption text-devflow-text-muted">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-2xl font-semibold tabular-nums text-devflow-text">{issues}</span>
        <span className="text-caption text-devflow-text-muted">
          issues · {points} pts
        </span>
      </div>
    </div>
  )
}

// ── Completion Ring ─────────────────────────────────────────────────

function CompletionRing({ percentage, label }: { percentage: number; label: string }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" className="-rotate-90">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="var(--df-border)"
          strokeWidth="6"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="var(--df-primary)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="mt-1 text-xl font-bold tabular-nums text-devflow-text">
        {percentage}%
      </span>
      <span className="text-caption text-devflow-text-muted">{label}</span>
    </div>
  )
}

// ── Issue Table ─────────────────────────────────────────────────────

function IssueTable({
  title,
  issues,
  icon: Icon,
  accent,
  emptyText,
  extraColumns,
}: {
  title: string
  issues: SprintReportIssue[]
  icon: React.ElementType
  accent: string
  emptyText: string
  extraColumns?: { key: string; label: string; render: (i: SprintReportIssue) => React.ReactNode }[]
}) {
  if (issues.length === 0) {
    return (
      <div className="rounded-lg border border-devflow-border bg-devflow-surface px-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`size-4 ${accent}`} />
          <h4 className="text-body font-medium text-devflow-text">{title}</h4>
          <span className="ml-auto rounded-full bg-devflow-pill px-2 py-0.5 text-[11px] tabular-nums text-devflow-text-muted">
            0
          </span>
        </div>
        <p className="text-caption text-devflow-text-muted">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-devflow-border bg-devflow-surface overflow-hidden">
      <div className="flex items-center gap-2 border-b border-devflow-border px-4 py-3">
        <Icon className={`size-4 ${accent}`} />
        <h4 className="text-body font-medium text-devflow-text">{title}</h4>
        <span className="ml-auto rounded-full bg-devflow-pill px-2 py-0.5 text-[11px] tabular-nums text-devflow-text-muted">
          {issues.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-caption">
          <thead>
            <tr className="border-b border-devflow-border bg-devflow-card">
              <th className="px-4 py-2 font-medium text-devflow-text-muted">Key</th>
              <th className="px-4 py-2 font-medium text-devflow-text-muted">Title</th>
              <th className="px-4 py-2 font-medium text-devflow-text-muted">Type</th>
              <th className="px-4 py-2 font-medium text-devflow-text-muted">Priority</th>
              <th className="px-4 py-2 font-medium text-devflow-text-muted">Status</th>
              <th className="px-4 py-2 font-medium text-devflow-text-muted text-right">Points</th>
              {extraColumns?.map((col) => (
                <th key={col.key} className="px-4 py-2 font-medium text-devflow-text-muted">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr
                key={issue.issue_id}
                className="border-b border-devflow-border last:border-0 hover:bg-devflow-hover-overlay transition-colors"
              >
                <td className="px-4 py-2.5 font-mono text-devflow-primary whitespace-nowrap">
                  {issue.key}
                </td>
                <td className="px-4 py-2.5 text-devflow-text max-w-[280px] truncate">
                  {issue.title}
                </td>
                <td className="px-4 py-2.5">
                  <Badge label={issue.type} colorClass={TYPE_COLORS[issue.type] || 'bg-gray-500/15 text-gray-400'} />
                </td>
                <td className="px-4 py-2.5">
                  <Badge label={issue.priority} colorClass={PRIORITY_COLORS[issue.priority] || 'bg-gray-500/15 text-gray-400'} />
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-devflow-text-secondary">{issue.status_name}</span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-devflow-text">
                  {issue.story_points ?? '—'}
                </td>
                {extraColumns?.map((col) => (
                  <td key={col.key} className="px-4 py-2.5 text-devflow-text-secondary">
                    {col.render(issue)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Scope Change Summary ────────────────────────────────────────────

function ScopeChangeSummary({ scopeChange }: { scopeChange: SprintReportApi['scope_change'] }) {
  const isPositive = scopeChange.net_story_points > 0
  const isNegative = scopeChange.net_story_points < 0

  return (
    <div className="rounded-lg border border-devflow-border bg-devflow-surface px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="size-4 text-devflow-primary" />
        <h4 className="text-body font-medium text-devflow-text">Scope Change</h4>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-blue-400" />
            <span className="text-caption text-devflow-text-muted">Added</span>
          </div>
          <p className="mt-1 text-body tabular-nums text-devflow-text">
            +{scopeChange.issues_added} issues · +{scopeChange.points_added} pts
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="size-3.5 text-red-400" />
            <span className="text-caption text-devflow-text-muted">Removed</span>
          </div>
          <p className="mt-1 text-body tabular-nums text-devflow-text">
            −{scopeChange.issues_removed} issues · −{scopeChange.points_removed} pts
          </p>
        </div>
        <div>
          <span className="text-caption text-devflow-text-muted">Net Issues</span>
          <p className={`mt-1 text-body tabular-nums font-medium ${
            scopeChange.net_issues > 0 ? 'text-blue-400' : scopeChange.net_issues < 0 ? 'text-red-400' : 'text-devflow-text'
          }`}>
            {scopeChange.net_issues > 0 ? '+' : ''}{scopeChange.net_issues}
          </p>
        </div>
        <div>
          <span className="text-caption text-devflow-text-muted">Net Story Points</span>
          <p className={`mt-1 text-body tabular-nums font-medium ${
            isPositive ? 'text-blue-400' : isNegative ? 'text-red-400' : 'text-devflow-text'
          }`}>
            {isPositive ? '+' : ''}{scopeChange.net_story_points}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main Sprint Report Component ───────────────────────────────────

export function SprintReport() {
  const { projectId = '' } = useParams()
  const { selectedSprintId, setSelectedSprintId } = useReportsFilter()

  const [sprints, setSprints] = useState<SprintSummaryApi[]>([])
  const [report, setReport] = useState<SprintReportApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch sprints for selector
  const loadSprints = useCallback(async () => {
    try {
      const list = await getProjectSprints(projectId)
      setSprints(list)
      if (list.length > 0 && !selectedSprintId) {
        const active = list.find((s) => s.status === 'active')
        setSelectedSprintId(active ? active.id : list[0].id)
      }
    } catch (err: unknown) {
      console.error('Failed to load sprints', err)
    }
  }, [projectId, selectedSprintId, setSelectedSprintId])

  // Fetch sprint report data
  const loadReport = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getSprintReport(projectId, selectedSprintId || undefined)
      setReport(data)
      if (data.sprint_id && data.sprint_id !== selectedSprintId) {
        setSelectedSprintId(data.sprint_id)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sprint report')
    } finally {
      setLoading(false)
    }
  }, [projectId, selectedSprintId, setSelectedSprintId])

  useEffect(() => {
    void loadSprints()
  }, [projectId])

  useEffect(() => {
    if (selectedSprintId) {
      void loadReport()
    } else if (sprints.length === 0 && !loading) {
      setLoading(false)
    }
  }, [selectedSprintId, loadReport])

  const s = report?.summary
  const hasData = report && report.sprint_id

  return (
    <div className={layout.uiCard}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-devflow-border pb-4">
        <div>
          <h3 className="text-section-title text-devflow-text">Sprint Report</h3>
          <p className="mt-1 text-caption text-devflow-text-secondary">
            Committed vs completed work, scope changes, and carry-over analysis.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {sprints.length > 0 && (
            <select
              id="sprint-report-sprint-selector"
              value={selectedSprintId || ''}
              onChange={(e) => setSelectedSprintId(e.target.value || null)}
              className="rounded-md border border-devflow-border bg-devflow-surface px-3 py-1.5 text-body text-devflow-text focus:border-devflow-primary focus:outline-none"
            >
              {sprints.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} ({sp.status})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-devflow-muted" />
              ))}
            </div>
            <div className="h-8 w-1/3 rounded bg-devflow-muted" />
            <div className="h-[200px] w-full rounded bg-devflow-muted" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-body text-devflow-error font-medium">{error}</p>
            <button
              onClick={() => void loadReport()}
              className="mt-3 rounded-md bg-devflow-primary px-4 py-2 text-caption text-white hover:bg-devflow-primary-hover"
            >
              Retry
            </button>
          </div>
        ) : !selectedSprintId || sprints.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto size-10 text-devflow-text-muted opacity-40" />
            <p className="mt-3 text-body text-devflow-text-secondary">
              No sprints found. Create and start a sprint to view the sprint report.
            </p>
          </div>
        ) : !hasData ? (
          <div className="text-center py-12">
            <p className="text-body text-devflow-text-secondary">
              This sprint does not have a start date configured. Please configure sprint dates to view the report.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Completion rings + Summary cards */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              {/* Completion Rings */}
              <div className="flex items-center justify-center gap-6 rounded-lg border border-devflow-border bg-devflow-surface px-6 py-4 lg:shrink-0">
                <CompletionRing percentage={s!.completion_percentage} label="Issues" />
                <CompletionRing percentage={s!.story_point_completion_percentage} label="Story Pts" />
              </div>

              {/* Summary cards grid */}
              <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
                <SummaryCard
                  label="Committed"
                  issues={s!.committed_issues}
                  points={s!.committed_story_points}
                  icon={Circle}
                  accent="text-devflow-text-muted"
                />
                <SummaryCard
                  label="Completed"
                  issues={s!.completed_issues}
                  points={s!.completed_story_points}
                  icon={CheckCircle2}
                  accent="text-emerald-400"
                />
                <SummaryCard
                  label="Incomplete"
                  issues={s!.incomplete_issues}
                  points={s!.incomplete_story_points}
                  icon={Circle}
                  accent="text-amber-400"
                />
                <SummaryCard
                  label="Added"
                  issues={s!.added_issues}
                  points={s!.added_story_points}
                  icon={PlusCircle}
                  accent="text-blue-400"
                />
                <SummaryCard
                  label="Removed"
                  issues={s!.removed_issues}
                  points={s!.removed_story_points}
                  icon={MinusCircle}
                  accent="text-red-400"
                />
                <SummaryCard
                  label="Carry-over"
                  issues={s!.carry_over_issues}
                  points={s!.carry_over_story_points}
                  icon={ArrowRightCircle}
                  accent="text-violet-400"
                />
              </div>
            </div>

            {/* Scope Change */}
            <ScopeChangeSummary scopeChange={report!.scope_change} />

            {/* Issue Tables */}
            <IssueTable
              title="Completed Issues"
              issues={report!.completed}
              icon={CheckCircle2}
              accent="text-emerald-400"
              emptyText="No issues were completed during this sprint."
              extraColumns={[
                {
                  key: 'added',
                  label: 'Added?',
                  render: (i) => (
                    <span>{i.was_added_during_sprint ? 'Yes' : '—'}</span>
                  ),
                },
              ]}
            />

            <IssueTable
              title="Incomplete Issues"
              issues={report!.incomplete}
              icon={Circle}
              accent="text-amber-400"
              emptyText="All issues were completed. Great sprint!"
              extraColumns={[
                {
                  key: 'added',
                  label: 'Added?',
                  render: (i) => (
                    <span>{i.was_added_during_sprint ? 'Yes' : '—'}</span>
                  ),
                },
              ]}
            />

            <IssueTable
              title="Added During Sprint"
              issues={report!.added}
              icon={PlusCircle}
              accent="text-blue-400"
              emptyText="No issues were added during this sprint."
              extraColumns={[
                {
                  key: 'added_at',
                  label: 'Added At',
                  render: (i) => (
                    <span className="whitespace-nowrap">
                      {i.added_at
                        ? new Date(i.added_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </span>
                  ),
                },
              ]}
            />

            <IssueTable
              title="Removed During Sprint"
              issues={report!.removed}
              icon={MinusCircle}
              accent="text-red-400"
              emptyText="No issues were removed during this sprint."
              extraColumns={[
                {
                  key: 'committed_sp',
                  label: 'Committed Pts',
                  render: (i) => (
                    <span className="tabular-nums">
                      {i.committed_story_points ?? '—'}
                    </span>
                  ),
                },
                {
                  key: 'removed_at',
                  label: 'Removed At',
                  render: (i) => (
                    <span className="whitespace-nowrap">
                      {i.removed_at
                        ? new Date(i.removed_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </span>
                  ),
                },
              ]}
            />

            {report!.carry_over.length > 0 && (
              <IssueTable
                title="Carry-over"
                issues={report!.carry_over}
                icon={ArrowRightCircle}
                accent="text-violet-400"
                emptyText=""
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
