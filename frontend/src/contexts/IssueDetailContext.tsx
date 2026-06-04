import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { IssueDetailDrawer } from '@/features/issues/IssueDetailDrawer'
import type { ProjectIssue } from '@/types/issues'
import type { Task } from '@/types/tasks'
import {
  resolveIssueForDetail,
  type ResolveIssueInput,
} from '@/utils/resolveIssueForDetail'

type IssueDetailContextValue = {
  openIssueDetail: (input: ResolveIssueInput) => void
  closeIssueDetail: () => void
  isOpen: boolean
  activeIssue: ProjectIssue | null
}

const IssueDetailContext = createContext<IssueDetailContextValue | null>(null)

export function IssueDetailProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [activeIssue, setActiveIssue] = useState<ProjectIssue | null>(null)

  const openIssueDetail = useCallback((input: ResolveIssueInput) => {
    const issue = resolveIssueForDetail(input)
    if (!issue) return
    setActiveIssue(issue)
    setOpen(true)
  }, [])

  const closeIssueDetail = useCallback(() => {
    setOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      openIssueDetail,
      closeIssueDetail,
      isOpen: open,
      activeIssue,
    }),
    [openIssueDetail, closeIssueDetail, open, activeIssue],
  )

  return (
    <IssueDetailContext.Provider value={value}>
      {children}
      <IssueDetailDrawer
        open={open}
        issue={activeIssue}
        onClose={closeIssueDetail}
        onIssueUpdated={setActiveIssue}
      />
    </IssueDetailContext.Provider>
  )
}

export function useIssueDetail(): IssueDetailContextValue {
  const context = useContext(IssueDetailContext)
  if (!context) {
    throw new Error('useIssueDetail must be used within IssueDetailProvider')
  }
  return context
}

/** Convenience opener for task-based views (My Tasks, sprint list). */
export function useOpenIssueFromTask() {
  const { openIssueDetail } = useIssueDetail()
  return useCallback(
    (task: Task) => openIssueDetail({ task }),
    [openIssueDetail],
  )
}
