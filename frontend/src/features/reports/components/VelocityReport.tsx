import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ElementType } from 'react'
import { useParams } from 'react-router-dom'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import { getVelocityReport, type VelocityReportApi } from '@/api/reports'
import { useReportsFilter } from '@/features/reports/contexts/ReportsFilterContext'
import { layout } from '@/constants/layout'

function formatSprintLabel(name: string) {
  return name.length > 18 ? `${name.slice(0, 16)}...` : name
}

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string | number
  detail: string
  icon: ElementType
}) {
  return (
    <div className="rounded-lg border border-devflow-border bg-devflow-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-devflow-primary" />
        <span className="text-caption text-devflow-text-muted">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-devflow-text">
        {value}
      </div>
      <p className="mt-1 text-caption text-devflow-text-secondary">{detail}</p>
    </div>
  )
}

export function VelocityReport() {
  const { projectId = '' } = useParams()
  const { selectedSprintId, setSelectedSprintId } = useReportsFilter()

  const [report, setReport] = useState<VelocityReportApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadVelocity = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)
    try {
      const data = await getVelocityReport(projectId)
      setReport(data)
      const completed = data.velocity_history.filter((item) => item.status === 'completed')
      if (!selectedSprintId && completed.length > 0) {
        setSelectedSprintId(completed[completed.length - 1].sprint_id)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load velocity report')
    } finally {
      setLoading(false)
    }
  }, [projectId, selectedSprintId, setSelectedSprintId])

  useEffect(() => {
    void loadVelocity()
  }, [loadVelocity])

  const completedSprints = useMemo(
    () => report?.velocity_history.filter((item) => item.status === 'completed') ?? [],
    [report],
  )

  const selectedSprint = useMemo(
    () => report?.velocity_history.find((item) => item.sprint_id === selectedSprintId) ?? null,
    [report, selectedSprintId],
  )

  const chartData = useMemo(
    () =>
      completedSprints.map((item) => ({
        name: formatSprintLabel(item.sprint_name),
        sprint: item.sprint_name,
        Committed: item.committed_story_points,
        Completed: item.completed_story_points,
        'Rolling Average': item.rolling_average,
      })),
    [completedSprints],
  )

  const hasData = chartData.length > 0
  const trendIcon = report?.trend.direction === 'down' ? TrendingDown : TrendingUp
  const trendLabel =
    report?.trend.direction === 'stable'
      ? 'Stable'
      : report?.trend.direction === 'down'
        ? 'Down'
        : 'Up'

  return (
    <div className={layout.uiCard}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-devflow-border pb-4">
        <div>
          <h3 className="text-section-title text-devflow-text">Velocity</h3>
          <p className="mt-1 text-caption text-devflow-text-secondary">
            Committed and completed story points across completed sprints.
          </p>
        </div>

        {report && report.velocity_history.length > 0 && (
          <select
            value={selectedSprintId || ''}
            onChange={(e) => setSelectedSprintId(e.target.value || null)}
            className="rounded-md border border-devflow-border bg-devflow-surface px-3 py-1.5 text-body text-devflow-text focus:border-devflow-primary focus:outline-none"
          >
            <option value="">Select sprint</option>
            {report.velocity_history.map((sprint) => (
              <option key={sprint.sprint_id} value={sprint.sprint_id}>
                {sprint.sprint_name} ({sprint.status})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-devflow-muted" />
              ))}
            </div>
            <div className="h-[360px] rounded bg-devflow-muted" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-body font-medium text-devflow-error">{error}</p>
            <button
              onClick={() => void loadVelocity()}
              className="mt-3 rounded-md bg-devflow-primary px-4 py-2 text-caption text-white hover:bg-devflow-primary-hover"
            >
              Retry
            </button>
          </div>
        ) : !report || report.velocity_history.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart3 className="mx-auto size-10 text-devflow-text-muted opacity-40" />
            <p className="mt-3 text-body text-devflow-text-secondary">
              No sprint history is available yet. Complete a sprint to build a velocity baseline.
            </p>
          </div>
        ) : !hasData ? (
          <div className="py-12 text-center">
            <BarChart3 className="mx-auto size-10 text-devflow-text-muted opacity-40" />
            <p className="mt-3 text-body text-devflow-text-secondary">
              Velocity excludes cancelled sprints. Complete a sprint to view trend data.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                label="Average Velocity"
                value={report.metrics.average_velocity}
                detail={`${report.sprint_summary.completed_sprints} completed sprints`}
                icon={Activity}
              />
              <MetricTile
                label="Rolling Average"
                value={report.rolling_average.value}
                detail={`Last ${report.rolling_average.sprint_count} of ${report.rolling_average.window}`}
                icon={BarChart3}
              />
              <MetricTile
                label="Trend"
                value={trendLabel}
                detail={`${report.trend.delta > 0 ? '+' : ''}${report.trend.delta} pts vs previous`}
                icon={trendIcon}
              />
              <MetricTile
                label="Selected Sprint"
                value={selectedSprint?.completed_story_points ?? '-'}
                detail={selectedSprint ? `${selectedSprint.sprint_name} completed pts` : 'Choose a sprint'}
                icon={Activity}
              />
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--df-border)" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--df-text-muted)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--df-text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--df-card)',
                      borderColor: 'var(--df-border)',
                      borderRadius: '8px',
                      color: 'var(--df-text)',
                    }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.sprint ?? ''}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Committed" fill="var(--df-text-muted)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed" fill="var(--df-primary)" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="Rolling Average"
                    stroke="var(--df-success)"
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 1.5 }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
