import { useState } from 'react'
import { useOpenIssueFromTask } from '@/contexts/IssueDetailContext'
import { useIssueCardClick } from '@/hooks/useIssueCardClick'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { LabelBadge } from '@/components/ui/LabelBadge'
import { PriorityIndicator } from '@/components/ui/PriorityIndicator'
import type { Task } from '@/types/tasks'
import { cn } from '@/utils/cn'

type IssueCardProps = {
  task: Task
  onDragStart: (taskId: string) => void
  onDragEnd: () => void
  isDragging?: boolean
}

export function IssueCard({
  task,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: IssueCardProps) {
  const [grabbed, setGrabbed] = useState(false)
  const openIssue = useOpenIssueFromTask()
  const { onClick, onKeyDown, onDragStart: onCardDragStart, onDragEnd: onCardDragEnd } =
    useIssueCardClick(() => openIssue(task))
  const ProjectIcon = task.projectIcon
  const isDone = task.status === 'done'
  const isInProgress = task.status === 'in_progress'

  return (
    <article
      role="button"
      tabIndex={0}
      draggable
      onClick={onClick}
      onKeyDown={onKeyDown}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/task-id', task.id)
        e.dataTransfer.effectAllowed = 'move'
        setGrabbed(true)
        onCardDragStart()
        onDragStart(task.id)
      }}
      onDragEnd={() => {
        setGrabbed(false)
        onCardDragEnd()
        onDragEnd()
      }}
      className={cn(
        'issue-card cursor-pointer',
        isInProgress && 'issue-card--in-progress',
        isDone && 'issue-card--done',
        (grabbed || isDragging) && 'issue-card--dragging',
      )}
    >
      <div className="issue-card__top">
        <span className="issue-card__key">{task.key}</span>
        <PriorityIndicator priority={task.priority} />
      </div>

      <h3
        className={cn(
          'issue-card__title',
          isDone && 'issue-card__title--done',
        )}
      >
        {task.title}
      </h3>

      <div className="issue-card__meta">
        <LabelBadge label={task.label} variant={task.labelVariant} />
        <span
          className={cn(
            'issue-card__due',
            task.dueOverdue && 'issue-card__due--overdue',
          )}
        >
          {task.dueDate}
        </span>
      </div>

      <div className="issue-card__footer">
        <div className="issue-card__project">
          <ProjectIcon className="size-3 shrink-0" strokeWidth={1.75} />
          <span>{task.project}</span>
        </div>
        <UserAvatar name={task.assignee.name} color={task.assignee.color} size={20} />
      </div>
    </article>
  )
}
