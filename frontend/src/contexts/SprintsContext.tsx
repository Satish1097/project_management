import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  addSprintToRegistry,
  getSprints,
  updateSprintInRegistry,
} from '@/services/sprintsRegistry'
import type { Sprint } from '@/types/sprints'

type SprintsContextValue = {
  sprints: Sprint[]
  addSprint: (sprint: Sprint) => void
  updateSprint: (sprintId: string, patch: Partial<Sprint>) => void
  refresh: () => void
}

const SprintsContext = createContext<SprintsContextValue | null>(null)

export function SprintsProvider({ children }: { children: ReactNode }) {
  const [sprints, setSprints] = useState<Sprint[]>(() => getSprints())

  const refresh = useCallback(() => {
    setSprints(getSprints())
  }, [])

  const addSprint = useCallback(
    (sprint: Sprint) => {
      addSprintToRegistry(sprint)
      refresh()
    },
    [refresh],
  )

  const updateSprint = useCallback(
    (sprintId: string, patch: Partial<Sprint>) => {
      updateSprintInRegistry(sprintId, patch)
      refresh()
    },
    [refresh],
  )

  const value = useMemo(
    () => ({ sprints, addSprint, updateSprint, refresh }),
    [sprints, addSprint, updateSprint, refresh],
  )

  return (
    <SprintsContext.Provider value={value}>{children}</SprintsContext.Provider>
  )
}

export function useSprints(): SprintsContextValue {
  const context = useContext(SprintsContext)
  if (!context) {
    throw new Error('useSprints must be used within SprintsProvider')
  }
  return context
}
