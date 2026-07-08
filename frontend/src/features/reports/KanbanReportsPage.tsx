import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Clock,
  GitBranch,
  Timer,
} from 'lucide-react'
import { getProjectReportSummary, type ProjectReportSummaryApi } from '@/api/projects'
import { MetricCard } from '@/components/ui/MetricCard'
import { ReportCard } from '@/features/reports/ReportCard'

export function KanbanReportsPage() {
  const { projectId = '' } = useParams()
  const [summary, setSummary] = useState<ProjectReportSummaryApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)
    try {
      const report = await getProjectReportSummary(projectId)
      setSummary(report)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load project summary')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  return (
    <main className="page-main">
      <div className="page-stack">
        <div>
          <h2 className="text-page-title text-devflow-text">Reports</h2>
          <p className="mt-1 text-body text-devflow-text-secondary">
            Flow metrics for this Kanban project.
          </p>
        </div>

        {loading ? (
          <p className="text-body text-devflow-text-secondary">Loading summary…</p>
        ) : error ? (
          <p className="text-caption text-devflow-error">{error}</p>
        ) : summary ? (
          <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total issues" value={String(summary.total_issues)} />
            <MetricCard label="Open issues" value={String(summary.open_issues)} />
            <MetricCard label="Done issues" value={String(summary.done_issues)} />
            <MetricCard
              label="To do issues"
              value={String(summary.todo_issues ?? summary.open_issues)}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportCard
            title="Cycle Time"
            description="How long issues spend in progress before completion."
            icon={Timer}
            status="coming-soon"
          />
          <ReportCard
            title="Lead Time"
            description="Time from issue creation to completion."
            icon={Clock}
            status="coming-soon"
          />
          <ReportCard
            title="Cumulative Flow Diagram"
            description="Issue counts by status over time."
            icon={GitBranch}
            status="coming-soon"
          />
          <ReportCard
            title="Throughput"
            description="Issues completed per time period."
            icon={Activity}
            status="coming-soon"
          />
        </div>

        <section className="rounded-lg border border-dashed border-devflow-border bg-[var(--df-empty-state)] px-6 py-8 text-center">
          <BarChart3 className="mx-auto size-8 text-devflow-text-muted" />
          <p className="mt-3 text-body text-devflow-text-secondary">
            Kanban flow analytics are coming soon. Summary stats above use your
            existing project data; cycle time, lead time, CFD, and throughput
            reports will be added in a future release.
          </p>
        </section>
      </div>
    </main>
  )
}
