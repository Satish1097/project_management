import { getProjectReportSummary } from '@/api/projects'
import { buildIssueCountLabels } from '@/services/mapProjectApi'
import {
  getProjectByIdFromRegistry,
  upsertProjectInRegistry,
} from '@/services/projectsRegistry'

export async function syncProjectOpenIssueCount(projectId: string): Promise<number | null> {
  try {
    const report = await getProjectReportSummary(projectId)
    const existing = getProjectByIdFromRegistry(projectId)
    if (existing) {
      upsertProjectInRegistry({
        ...existing,
        ...buildIssueCountLabels(report.open_issues),
      })
    }
    return report.open_issues
  } catch {
    return null
  }
}
