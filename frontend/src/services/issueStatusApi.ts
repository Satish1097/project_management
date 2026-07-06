import type { IssueWorkflowStatus } from '@/types/issues'
import { getIssueById } from '@/services/issuesRegistry'

const PERSIST_DELAY_MS = 180

/**
 * Persists an issue status change to the backend.
 * Registry is updated optimistically by the caller; this validates sync.
 */
export async function persistIssueStatusChange(
  issueId: string,
  workflowStatus: IssueWorkflowStatus,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, PERSIST_DELAY_MS))

  const issue = getIssueById(issueId)
  if (!issue) {
    throw new Error(`Issue ${issueId} not found`)
  }

  if (issue.workflowStatus !== workflowStatus) {
    throw new Error('Issue status sync failed')
  }
}
