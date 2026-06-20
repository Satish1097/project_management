import { getProjectMembers, type ProjectMemberRecord } from '@/api/members'
import { ApiError } from '@/api/types'

export type ProjectMembersSnapshot = {
  members: ProjectMemberRecord[]
  loading: boolean
  error: string | null
  fetched: boolean
}

const EMPTY_SNAPSHOT: ProjectMembersSnapshot = {
  members: [],
  loading: false,
  error: null,
  fetched: false,
}

const cache = new Map<string, ProjectMembersSnapshot>()
const inflight = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()
let version = 0

function notify() {
  version += 1
  listeners.forEach((listener) => listener())
}

function setSnapshot(projectId: string, patch: Partial<ProjectMembersSnapshot>) {
  const current = cache.get(projectId) ?? { ...EMPTY_SNAPSHOT }
  cache.set(projectId, { ...current, ...patch })
  notify()
}

export function subscribeProjectMembers(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getProjectMembersStoreVersion(): number {
  return version
}

export function getProjectMembersSnapshot(projectId: string): ProjectMembersSnapshot {
  return cache.get(projectId) ?? EMPTY_SNAPSHOT
}

export function ensureProjectMembersLoaded(projectId: string): Promise<void> {
  if (!projectId) return Promise.resolve()

  const entry = cache.get(projectId)
  if (entry?.fetched && !entry.loading) {
    return Promise.resolve()
  }

  const existing = inflight.get(projectId)
  if (existing) return existing

  const promise = (async () => {
    setSnapshot(projectId, { loading: true, error: null })

    try {
      const members = await getProjectMembers(projectId)
      setSnapshot(projectId, {
        members,
        loading: false,
        error: null,
        fetched: true,
      })
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load members.'
      setSnapshot(projectId, {
        loading: false,
        error: message,
        fetched: true,
      })
    } finally {
      inflight.delete(projectId)
    }
  })()

  inflight.set(projectId, promise)
  return promise
}

export async function reloadProjectMembers(projectId: string): Promise<void> {
  if (!projectId) return

  cache.delete(projectId)
  inflight.delete(projectId)
  notify()
  await ensureProjectMembersLoaded(projectId)
}

export function resetProjectMembersStore(): void {
  cache.clear()
  inflight.clear()
  notify()
}
