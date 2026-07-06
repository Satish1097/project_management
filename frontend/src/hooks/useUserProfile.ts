import { useMemo, useSyncExternalStore } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  findProjectMember,
  getProjectMembersStoreVersion,
  subscribeProjectMembers,
} from '@/services/projectMembersStore'
import type { UserProfileInfo, UserProfileInput } from '@/types/userProfile'
import { resolveUserProfile } from '@/utils/userProfileResolver'

export function useUserProfile(
  input: UserProfileInput | null,
  projectId?: string,
): UserProfileInfo | null {
  const { user: authUser } = useAuth()

  const storeVersion = useSyncExternalStore(
    subscribeProjectMembers,
    getProjectMembersStoreVersion,
    getProjectMembersStoreVersion,
  )

  return useMemo(() => {
    if (!input) return null

    return resolveUserProfile({
      input,
      projectId,
      authUser,
      findMember: findProjectMember,
    })
    // storeVersion keeps profile in sync when member cache updates
  }, [input, projectId, authUser, storeVersion])
}
