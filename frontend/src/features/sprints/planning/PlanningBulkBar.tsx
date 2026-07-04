import { ArrowLeft, Trash2, X } from 'lucide-react'
import { useLayoutEffect, useState } from 'react'
import {
  InlineAssigneePicker,
  InlineLabelPicker,
  InlinePriorityPicker,
  InlineSprintPicker,
} from '@/components/issues/inline'
import { useOptimisticIssueActions } from '@/hooks/useOptimisticIssueActions'
import { getIssueById } from '@/services/issuesRegistry'
import { updateIssue as apiUpdateIssue } from '@/api/issues'
import { ApiError } from '@/api/types'
import { showToast } from '@/features/toast/toast'
import { useIssues } from '@/contexts/IssuesContext'
import { refreshKanbanBoard } from '@/features/kanban/kanbanRefreshBridge'
import { mapIssueDetailToUi } from '@/services/mapIssueApi'
import { upsertApiIssue } from '@/services/issuesRegistry'
import {
  mapPriorityLevelToKanban,
  type IssuePriorityLevel,
} from '@/types/issues'
import { UNASSIGNED_ASSIGNEE } from '@/utils/assigneeColors'
import { cn } from '@/utils/cn'

export type PlanningSelectionContext = 'backlog' | 'sprint' | 'mixed'

type PlanningBulkBarProps = {
  projectId: string
  selectedIds: string[]
  selectionContext: PlanningSelectionContext
  onClearSelection: () => void
  onBeforeDelete?: (ids: string[]) => void
  className?: string
}

const DEFAULT_PROJECT_HEADER_OFFSET_PX = 120

function useProjectHeaderStickyTop() {
  const [topPx, setTopPx] = useState(DEFAULT_PROJECT_HEADER_OFFSET_PX)

  useLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>('.shell-main > header')
    if (!header) return

    const sync = () => {
      setTopPx(header.getBoundingClientRect().height)
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(header)
    window.addEventListener('resize', sync)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [])

  return topPx
}

export function resolvePlanningSelectionContext(
  selectedIds: string[],
): PlanningSelectionContext {
  if (selectedIds.length === 0) return 'backlog'

  let hasBacklog = false
  let hasSprint = false

  for (const issueId of selectedIds) {
    const issue = getIssueById(issueId)
    if (!issue) continue
    if (issue.sprintId === null) hasBacklog = true
    else hasSprint = true
    if (hasBacklog && hasSprint) return 'mixed'
  }

  return hasSprint ? 'sprint' : 'backlog'
}

export function PlanningBulkBar({
  projectId,
  selectedIds,
  selectionContext,
  onClearSelection,
  onBeforeDelete,
  className,
}: PlanningBulkBarProps) {
  const projectHeaderOffsetPx = useProjectHeaderStickyTop()
  const { bulkAssignSprintOptimistic, bulkPatchIssues, bulkDelete } =
    useOptimisticIssueActions(projectId)
  const { updateIssue, refresh } = useIssues()

  const appendLabelToSelected = async (labelId: string, labelName: string) => {
    const snapshots = selectedIds
      .map((issueId) => getIssueById(issueId))
      .filter((issue): issue is NonNullable<typeof issue> => Boolean(issue))

    for (const issue of snapshots) {
      if (issue.labelIds?.includes(labelId)) continue
      const nextIds = [...(issue.labelIds ?? []), labelId]
      const nextNames = [...(issue.labels ?? []), labelName]
      updateIssue(issue.id, {
        labelIds: nextIds,
        labels: nextNames,
        label: nextNames[0] ?? issue.label,
      })
    }

    try {
      await Promise.all(
        snapshots.map(async (issue) => {
          if (issue.labelIds?.includes(labelId)) return
          const nextIds = [...(issue.labelIds ?? []), labelId]
          const updated = await apiUpdateIssue(issue.id, { labels: nextIds })
          upsertApiIssue(mapIssueDetailToUi(updated, projectId))
        }),
      )
      refresh()
      refreshKanbanBoard()
      onClearSelection()
    } catch (error) {
      for (const issue of snapshots) {
        updateIssue(issue.id, issue)
      }
      refresh()
      const message =
        error instanceof ApiError ? error.message : 'Failed to add label.'
      showToast(message, 'error')
    }
  }

  if (selectedIds.length === 0) return null

  const showMoveToSprint =
    selectionContext === 'backlog' || selectionContext === 'sprint'
  const showMoveToBacklog = selectionContext === 'sprint'

  return (
    <div
      className={cn(
        'sticky z-[9] bg-devflow-surface',
        className,
      )}
      style={{ top: projectHeaderOffsetPx }}
    >
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-devflow-primary/25',
          'bg-[var(--df-nav-tint)]/12 px-2.5 py-1.5',
        )}
        role="toolbar"
        aria-label="Bulk actions"
      >
      <span className="text-[12px] font-medium tabular-nums text-devflow-text">
        {selectedIds.length} selected
      </span>

      <div className="hidden h-4 w-px bg-devflow-border sm:block" aria-hidden />

      <div className="flex items-center gap-1">
        <span className="text-[11px] text-devflow-text-muted">Assign</span>
        <InlineAssigneePicker
          projectId={projectId}
          value={null}
          compact
          onChange={(userId, member) => {
            void bulkPatchIssues(
              selectedIds,
              {
                assigneeId: userId,
                assignee: userId && member ? member : UNASSIGNED_ASSIGNEE,
              },
              { assignee: userId },
            ).then(() => onClearSelection())
          }}
        />
      </div>

      <div className="flex items-center gap-1">
        <span className="text-[11px] text-devflow-text-muted">Priority</span>
        <InlinePriorityPicker
          value="medium"
          compact
          onChange={(priority: IssuePriorityLevel) => {
            void bulkPatchIssues(
              selectedIds,
              {
                priorityLevel: priority,
                priority: mapPriorityLevelToKanban(priority),
              },
              { priority },
            ).then(() => onClearSelection())
          }}
        />
      </div>

      <div className="flex items-center gap-1">
        <span className="text-[11px] text-devflow-text-muted">Labels</span>
        <InlineLabelPicker
          projectId={projectId}
          value={[]}
          onChange={(labelIds, labelNames) => {
            const labelId = labelIds[labelIds.length - 1]
            const labelName = labelNames[labelNames.length - 1]
            if (labelId && labelName) {
              void appendLabelToSelected(labelId, labelName)
            }
          }}
        />
      </div>

      {showMoveToSprint ? (
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-devflow-text-muted">Sprint</span>
          <InlineSprintPicker
            projectId={projectId}
            value={null}
            compact
            onChange={(sprintId) => {
              void bulkAssignSprintOptimistic(selectedIds, sprintId).then(() =>
                onClearSelection(),
              )
            }}
          />
        </div>
      ) : null}

      {showMoveToBacklog ? (
        <button
          type="button"
          onClick={() => {
            void bulkAssignSprintOptimistic(selectedIds, null).then(() =>
              onClearSelection(),
            )
          }}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-devflow-text-secondary hover:bg-devflow-muted"
        >
          <ArrowLeft className="size-3" />
          Move to backlog
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (
            window.confirm(
              `Delete ${selectedIds.length} issue${selectedIds.length === 1 ? '' : 's'}?`,
            )
          ) {
            onBeforeDelete?.(selectedIds)
            void bulkDelete(selectedIds).then(() => onClearSelection())
          }
        }}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-devflow-error hover:bg-devflow-error/8"
      >
        <Trash2 className="size-3" />
        Delete
      </button>

      <button
        type="button"
        onClick={onClearSelection}
        className="ml-auto inline-flex items-center gap-0.5 text-[11px] text-devflow-text-muted hover:text-devflow-text"
      >
        <X className="size-3" />
        Clear
      </button>
      </div>
    </div>
  )
}
