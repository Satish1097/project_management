import { useEffect } from 'react'
import { useSprints } from '@/contexts/SprintsContext'
import { useProjectMethodology } from '@/hooks/useProjectMethodology'

export function useLoadProjectSprints(projectId: string) {
  const { loadProjectSprints, loading, error } = useSprints()
  const { isScrum } = useProjectMethodology(projectId)

  useEffect(() => {
    if (projectId && isScrum) {
      void loadProjectSprints(projectId)
    }
  }, [projectId, isScrum, loadProjectSprints])

  return { loading, error }
}
