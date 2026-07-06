import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { IssueViewMode } from '@/types/tasks'

const VALID_MODES = new Set<IssueViewMode>(['list', 'board'])

function parseViewMode(value: string | null): IssueViewMode {
  if (value && VALID_MODES.has(value as IssueViewMode)) {
    return value as IssueViewMode
  }
  return 'board'
}

export function useBoardViewMode() {
  const [searchParams, setSearchParams] = useSearchParams()
  const viewMode = parseViewMode(searchParams.get('view'))

  const setViewMode = useCallback(
    (mode: IssueViewMode) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('view', mode)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { viewMode, setViewMode }
}
