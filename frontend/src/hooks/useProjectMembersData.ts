import { useEffect, useMemo, useSyncExternalStore } from 'react'
import {
  ensureProjectMembersLoaded,
  getProjectMembersSnapshot,
  getProjectMembersStoreVersion,
  subscribeProjectMembers,
  type ProjectMembersSnapshot,
} from '@/services/projectMembersStore'

export function useProjectMembersData(projectId: string): ProjectMembersSnapshot {
  const storeVersion = useSyncExternalStore(
    subscribeProjectMembers,
    getProjectMembersStoreVersion,
    getProjectMembersStoreVersion,
  )

  useEffect(() => {
    if (projectId) {
      void ensureProjectMembersLoaded(projectId)
    }
  }, [projectId])

  return useMemo(
    () => getProjectMembersSnapshot(projectId),
    [projectId, storeVersion],
  )
}

export function useProjectsMembersData(
  projectIds: string[],
): Record<string, ProjectMembersSnapshot> {
  const idsKey = useMemo(
    () => [...new Set(projectIds.filter(Boolean))].sort().join(','),
    [projectIds],
  )
  const uniqueIds = useMemo(
    () => (idsKey ? idsKey.split(',') : []),
    [idsKey],
  )

  const storeVersion = useSyncExternalStore(
    subscribeProjectMembers,
    getProjectMembersStoreVersion,
    getProjectMembersStoreVersion,
  )

  useEffect(() => {
    uniqueIds.forEach((projectId) => {
      void ensureProjectMembersLoaded(projectId)
    })
  }, [idsKey, uniqueIds])

  return useMemo(() => {
    const snapshots: Record<string, ProjectMembersSnapshot> = {}
    for (const projectId of uniqueIds) {
      snapshots[projectId] = getProjectMembersSnapshot(projectId)
    }
    return snapshots
  }, [uniqueIds, storeVersion])
}
