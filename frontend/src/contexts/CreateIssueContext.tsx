import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { CreateIssueDrawer } from '@/features/issues/CreateIssueDrawer'
import {
  resolveCreateIssueContext,
  type CreateIssueDefaults,
} from '@/utils/resolveCreateIssueContext'

type CreateIssueContextValue = {
  openCreateIssue: (overrides?: Partial<CreateIssueDefaults>) => void
}

const CreateIssueContext = createContext<CreateIssueContextValue | null>(null)

export function CreateIssueProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [defaults, setDefaults] = useState<CreateIssueDefaults>({
    source: 'global',
  })

  const openCreateIssue = useCallback(
    (overrides?: Partial<CreateIssueDefaults>) => {
      const fromRoute = resolveCreateIssueContext(pathname)
      setDefaults({ ...fromRoute, ...overrides })
      setOpen(true)
    },
    [pathname],
  )

  const closeCreateIssue = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ openCreateIssue }), [openCreateIssue])

  return (
    <CreateIssueContext.Provider value={value}>
      {children}
      <CreateIssueDrawer
        open={open}
        onClose={closeCreateIssue}
        defaults={defaults}
      />
    </CreateIssueContext.Provider>
  )
}

export function useCreateIssue(): CreateIssueContextValue {
  const context = useContext(CreateIssueContext)
  if (!context) {
    throw new Error('useCreateIssue must be used within CreateIssueProvider')
  }
  return context
}
