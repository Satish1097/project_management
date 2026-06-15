import { useEffect } from 'react'
import { useSprints } from '@/contexts/SprintsContext'

export function useLoadProjectSprints(projectId: string) {
  const { loadProjectSprints, loading, error } = useSprints()

  useEffect(() => {
    if (projectId) {
      void loadProjectSprints(projectId)
    }
  }, [projectId, loadProjectSprints])

  return { loading, error }
}
