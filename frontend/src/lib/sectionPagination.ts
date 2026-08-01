/**
 * Shared helpers for paginated section/column lists (backlog sections, kanban columns).
 */

export type SectionPaginationState<T extends { id: string }> = {
  issues: T[]
  page: number
  hasNext: boolean
  loading: boolean
  total: number
  initialized: boolean
}

export function createEmptySectionState<
  T extends { id: string },
>(): SectionPaginationState<T> {
  return {
    issues: [],
    page: 0,
    hasNext: false,
    loading: false,
    total: 0,
    initialized: false,
  }
}

/**
 * Merge two lists keyed by `id`.
 * Items from `primary` keep order and win on conflicts; `secondary` items
 * are appended when their id is not already present.
 */
export function mergeItemsById<T extends { id: string }>(
  primary: T[],
  secondary: T[],
): T[] {
  const seen = new Set<string>()
  const result: T[] = []

  for (const item of primary) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    result.push(item)
  }

  for (const item of secondary) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    result.push(item)
  }

  return result
}
