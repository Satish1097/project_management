import { useIssueDetail } from '@/contexts/IssueDetailContext'
import { Avatar } from '@/components/ui/Avatar'
import { LabelBadge } from '@/components/ui/LabelBadge'
import { PriorityIndicator } from '@/components/ui/PriorityIndicator'
import type { KanbanIssue } from '@/types/kanban'
import type { TaskPriority } from '@/types/tasks'
import { cn } from '@/utils/cn'

type TaskCardProps = {
  issue: KanbanIssue
  columnId: string
}

function toTaskPriority(priority: KanbanIssue['priority']): TaskPriority {
  return priority ?? 'none'
}

export function TaskCard({ issue, columnId }: TaskCardProps) {
  const { openIssueDetail } = useIssueDetail()
  const isDone = issue.done === true || columnId === 'done'
  const isInProgress = columnId === 'in_progress'
  const labelVariant =
    issue.label.toLowerCase().includes('critical') ? 'critical' : 'default'

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => openIssueDetail({ issueId: issue.id })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openIssueDetail({ issueId: issue.id })
        }
      }}
      className={cn(
        'issue-card cursor-pointer',
        isInProgress && 'issue-card--in-progress',
        isDone && 'issue-card--done',
      )}
    >
      <div className="issue-card__top">
        <span className="issue-card__key">{issue.key}</span>
        <PriorityIndicator priority={toTaskPriority(issue.priority)} />
      </div>

      <h3
        className={cn(
          'issue-card__title',
          isDone && 'issue-card__title--done',
        )}
      >
        {issue.title}
      </h3>

      <div className="issue-card__meta">
        <LabelBadge label={issue.label} variant={labelVariant} />
      </div>

      <div className="issue-card__footer">
        <div className="issue-card__project" aria-hidden="true" />
        <Avatar
          name={issue.assignee.name}
          color={issue.assignee.color}
          size={20}
        />
      </div>
    </article>
  )
}
