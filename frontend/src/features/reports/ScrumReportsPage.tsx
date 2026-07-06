import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  LineChart,
  TrendingDown,
} from 'lucide-react'
import { getProjectSprintHealth, type SprintHealthApi } from '@/api/projects'
import { ReportCard } from '@/features/reports/ReportCard'
import { SprintHealthSection } from '@/features/reports/SprintHealthSection'

export function ScrumReportsPage() {
  const { projectId = '' } = useParams()
  const [sprintHealth, setSprintHealth] = useState<SprintHealthApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSprintHealth = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)
    try {
      const items = await getProjectSprintHealth(projectId)
      setSprintHealth(items)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sprint health')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadSprintHealth()
  }, [loadSprintHealth])

  return (
    <main className="page-main">
      <div className="page-stack">
        <div>
          <h2 className="text-page-title text-devflow-text">Reports</h2>
          <p className="mt-1 text-body text-devflow-text-secondary">
            Sprint delivery metrics for this Scrum project.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportCard
            title="Burndown"
            description="Track remaining work over the course of a sprint."
            icon={TrendingDown}
            status="coming-soon"
          />
          <ReportCard
            title="Sprint Report"
            description="Committed vs completed work for finished sprints."
            icon={BarChart3}
            status="coming-soon"
          />
          <ReportCard
            title="Velocity"
            description="Story points completed across recent sprints."
            icon={Activity}
            status="coming-soon"
          />
          <ReportCard
            title="Sprint Health"
            description="Active sprint progress, story points, and issue counts."
            icon={LineChart}
            status="available"
          />
        </div>

        <SprintHealthSection
          items={sprintHealth}
          loading={loading}
          error={error}
        />
      </div>
    </main>
  )
}
