import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getBurndownReport, type BurndownReportApi } from '@/api/reports'
import { useReportsFilter } from '@/features/reports/contexts/ReportsFilterContext'
import { layout } from '@/constants/layout'
import { getProjectSprints, type SprintSummaryApi } from '@/api/sprints'

export function BurndownChart() {
  const { projectId = '' } = useParams()
  const { selectedSprintId, setSelectedSprintId, metricType, setMetricType } =
    useReportsFilter()

  const [sprints, setSprints] = useState<SprintSummaryApi[]>([])
  const [report, setReport] = useState<BurndownReportApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch Sprints list for selector
  const loadSprints = useCallback(async () => {
    try {
      const list = await getProjectSprints(projectId)
      setSprints(list)
      // Default to active sprint if none selected
      if (list.length > 0 && !selectedSprintId) {
        const active = list.find((s) => s.status === 'active')
        setSelectedSprintId(active ? active.id : list[0].id)
      }
    } catch (err: unknown) {
      console.error('Failed to load sprints', err)
    }
  }, [projectId, selectedSprintId, setSelectedSprintId])

  // 2. Fetch Burndown data
  const loadBurndown = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getBurndownReport(projectId, selectedSprintId || undefined)
      setReport(data)
      // Update selectedSprintId if backend picked the default for us
      if (data.sprint_id && data.sprint_id !== selectedSprintId) {
        setSelectedSprintId(data.sprint_id)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load burndown data')
    } finally {
      setLoading(false)
    }
  }, [projectId, selectedSprintId, setSelectedSprintId])

  useEffect(() => {
    void loadSprints()
  }, [projectId])

  useEffect(() => {
    if (selectedSprintId) {
      void loadBurndown()
    } else if (sprints.length === 0 && !loading) {
      // If we loaded sprints and list is empty
      setLoading(false)
    }
  }, [selectedSprintId, loadBurndown])

  const chartData = report?.data_points.map((dp) => ({
    name: new Date(dp.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    Actual: metricType === 'points' ? dp.remaining_points : dp.remaining_issues,
    Ideal: metricType === 'points' ? dp.ideal_points : dp.ideal_issues,
  }))

  const hasData = chartData && chartData.length > 0

  return (
    <div className={layout.uiCard}>
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-devflow-border pb-4">
        <div>
          <h3 className="text-section-title text-devflow-text">Burndown Chart</h3>
          <p className="mt-1 text-caption text-devflow-text-secondary">
            Remaining work compared with the ideal sprint timeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sprint Select */}
          {sprints.length > 0 && (
            <select
              value={selectedSprintId || ''}
              onChange={(e) => setSelectedSprintId(e.target.value || null)}
              className="rounded-md border border-devflow-border bg-devflow-surface px-3 py-1.5 text-body text-devflow-text focus:border-devflow-primary focus:outline-none"
            >
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          )}

          {/* Metric Toggle */}
          <div className="flex overflow-hidden rounded-md border border-devflow-border bg-devflow-surface">
            <button
              onClick={() => setMetricType('points')}
              className={`px-3 py-1.5 text-caption font-medium transition-colors ${
                metricType === 'points'
                  ? 'bg-devflow-primary text-white'
                  : 'text-devflow-text hover:bg-devflow-hover-overlay'
              }`}
            >
              Story Points
            </button>
            <button
              onClick={() => setMetricType('count')}
              className={`px-3 py-1.5 text-caption font-medium transition-colors ${
                metricType === 'count'
                  ? 'bg-devflow-primary text-white'
                  : 'text-devflow-text hover:bg-devflow-hover-overlay'
              }`}
            >
              Issue Count
            </button>
          </div>
        </div>
      </div>

      {/* Content states */}
      <div className="mt-6 flex min-h-[350px] items-center justify-center">
        {loading ? (
          <div className="w-full space-y-4 animate-pulse">
            <div className="h-6 w-1/4 rounded bg-devflow-muted" />
            <div className="h-[300px] w-full rounded bg-devflow-muted" />
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-body text-devflow-error font-medium">{error}</p>
            <button
              onClick={() => void loadBurndown()}
              className="mt-3 rounded-md bg-devflow-primary px-4 py-2 text-caption text-white hover:bg-devflow-primary-hover"
            >
              Retry
            </button>
          </div>
        ) : !selectedSprintId || sprints.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-body text-devflow-text-secondary">
              No sprints found. Create and start a sprint in the Backlog to view burndown charts.
            </p>
          </div>
        ) : !hasData ? (
          <div className="text-center py-8">
            <p className="text-body text-devflow-text-secondary">
              This sprint does not have a start date configured. Please configure sprint dates to view the burndown chart.
            </p>
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
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
                  label={{
                    value: metricType === 'points' ? 'Story Points' : 'Issues',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: 'var(--df-text-muted)' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--df-card)',
                    borderColor: 'var(--df-border)',
                    borderRadius: '8px',
                    color: 'var(--df-text)',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="Actual"
                  stroke="var(--df-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="Ideal"
                  stroke="var(--df-text-muted)"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
