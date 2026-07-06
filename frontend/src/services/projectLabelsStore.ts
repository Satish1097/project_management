import {
  getProjectLabels,
  type LabelApi,
} from '@/api/labels'
import { ApiError } from '@/api/types'

export type ProjectLabelsSnapshot = {
  labels: LabelApi[]
  loading: boolean
  error: string | null
  fetched: boolean
}

const EMPTY_SNAPSHOT: ProjectLabelsSnapshot = {
  labels: [],
  loading: false,
  error: null,
  fetched: false,
}

const cache = new Map<string, ProjectLabelsSnapshot>()
const inflight = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()
let version = 0

function activeLabels(labels: LabelApi[]): LabelApi[] {
  return labels.filter((label) => !label.is_archived)
}

function notify() {
  version += 1
  listeners.forEach((listener) => listener())
}

function setSnapshot(projectId: string, patch: Partial<ProjectLabelsSnapshot>) {
  const current = cache.get(projectId) ?? { ...EMPTY_SNAPSHOT }
  cache.set(projectId, { ...current, ...patch })
  notify()
}

export function subscribeProjectLabels(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getProjectLabelsStoreVersion(): number {
  return version
}

export function getProjectLabelsSnapshot(projectId: string): ProjectLabelsSnapshot {
  return cache.get(projectId) ?? EMPTY_SNAPSHOT
}

export function ensureProjectLabelsLoaded(projectId: string): Promise<void> {
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
      const labels = await getProjectLabels(projectId)
      setSnapshot(projectId, {
        labels: activeLabels(labels),
        loading: false,
        error: null,
        fetched: true,
      })
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load labels.'
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

export async function reloadProjectLabels(projectId: string): Promise<void> {
  if (!projectId) return

  cache.delete(projectId)
  inflight.delete(projectId)
  notify()
  await ensureProjectLabelsLoaded(projectId)
}

export function addProjectLabelToStore(projectId: string, label: LabelApi): void {
  if (!projectId || label.is_archived) return

  const current = cache.get(projectId) ?? { ...EMPTY_SNAPSHOT }
  if (current.labels.some((item) => item.id === label.id)) {
    updateProjectLabelInStore(projectId, label)
    return
  }

  setSnapshot(projectId, {
    labels: [...current.labels, label],
    fetched: true,
  })
}

export function updateProjectLabelInStore(projectId: string, label: LabelApi): void {
  if (!projectId) return

  const current = cache.get(projectId) ?? { ...EMPTY_SNAPSHOT }
  const without = current.labels.filter((item) => item.id !== label.id)
  const labels = label.is_archived ? without : [...without, label]

  setSnapshot(projectId, {
    labels,
    fetched: true,
  })
}

export function removeProjectLabelFromStore(projectId: string, labelId: string): void {
  if (!projectId) return

  const current = cache.get(projectId) ?? { ...EMPTY_SNAPSHOT }
  setSnapshot(projectId, {
    labels: current.labels.filter((item) => item.id !== labelId),
    fetched: true,
  })
}

export function resetProjectLabelsStore(): void {
  cache.clear()
  inflight.clear()
  notify()
}
