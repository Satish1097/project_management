import { useEffect, useMemo, useState } from 'react'
import {
  getOrganizationMembers,
  type OrganizationMemberRecord,
} from '@/api/organizations'
import { ApiError } from '@/api/types'
import { avatarColorFromName } from '@/features/members/memberUtils'

export type OrganizationMemberOption = {
  id: string
  name: string
  email: string
  role: string
  color: string
}

type UseOrganizationMembersResult = {
  members: OrganizationMemberOption[]
  loading: boolean
  error: string | null
}

function toMemberOption(member: OrganizationMemberRecord): OrganizationMemberOption | null {
  if (!member.is_active || !member.user_id) return null
  const email = member.email?.trim()
  const name = member.display_name?.trim() || email
  if (!email || !name) return null

  return {
    id: member.user_id,
    name,
    email,
    role: member.role,
    color: avatarColorFromName(name),
  }
}

export function useOrganizationMembers(
  organizationId: string | null | undefined,
): UseOrganizationMembersResult {
  const [records, setRecords] = useState<OrganizationMemberRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setRecords([])
      setError(null)
      setLoading(false)
      return
    }
    const orgId = organizationId

    let cancelled = false
    setLoading(true)
    setError(null)

    async function loadMembers() {
      try {
        const data = await getOrganizationMembers(orgId)
        if (cancelled) return
        setRecords(data)
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof ApiError ? err.message : 'Failed to load workspace members.',
        )
        setRecords([])
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadMembers()
    return () => {
      cancelled = true
    }
  }, [organizationId])

  const members = useMemo(() => {
    const mapped = records
      .map(toMemberOption)
      .filter((member): member is OrganizationMemberOption => Boolean(member))
      .sort((a, b) => a.name.localeCompare(b.name))
    return mapped
  }, [records])

  return { members, loading, error }
}
