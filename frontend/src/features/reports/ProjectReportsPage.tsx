import { useProjectMethodology } from '@/hooks/useProjectMethodology'
import { KanbanReportsPage } from '@/features/reports/KanbanReportsPage'
import { ScrumReportsPage } from '@/features/reports/ScrumReportsPage'

export function ProjectReportsPage() {
  const { isKanban } = useProjectMethodology()

  if (isKanban) {
    return <KanbanReportsPage />
  }

  return <ScrumReportsPage />
}
