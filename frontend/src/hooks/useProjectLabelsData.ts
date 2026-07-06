import { useEffect, useMemo, useSyncExternalStore } from 'react'
import {
  ensureProjectLabelsLoaded,
  getProjectLabelsSnapshot,
  getProjectLabelsStoreVersion,
  subscribeProjectLabels,
  type ProjectLabelsSnapshot,
} from '@/services/projectLabelsStore'

export function useProjectLabelsData(projectId: string): ProjectLabelsSnapshot {
  const storeVersion = useSyncExternalStore(
    subscribeProjectLabels,
    getProjectLabelsStoreVersion,
    getProjectLabelsStoreVersion,
  )

  useEffect(() => {
    if (projectId) {
      void ensureProjectLabelsLoaded(projectId)
    }
  }, [projectId])

  return useMemo(
    () => getProjectLabelsSnapshot(projectId),
    [projectId, storeVersion],
  )
}
