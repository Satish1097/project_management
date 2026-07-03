import { UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { IssueAssignee } from '@/types/issues'
import { cn } from '@/utils/cn'

type AssigneeAvatarStackProps = {
  assignees: IssueAssignee[]
  size?: number
  maxVisible?: number
  className?: string
}

export function AssigneeAvatarStack({
  assignees,
  size = 20,
  maxVisible = 3,
  className,
}: AssigneeAvatarStackProps) {
  const visible = assignees.filter((assignee) => assignee.name !== 'Unassigned')

  if (visible.length === 0) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-devflow-muted text-devflow-text-muted',
          className,
        )}
        style={{ width: size, height: size }}
        title="Unassigned"
      >
        <UserRound className="size-[55%]" strokeWidth={2} />
      </div>
    )
  }

  const shown = visible.slice(0, maxVisible)
  const extra = visible.length - shown.length
  const tooltip = visible.map((assignee) => assignee.name).join(', ')

  return (
    <div className={cn('flex items-center', className)} title={tooltip}>
      {shown.map((assignee, index) => (
        <div
          key={`${assignee.name}-${index}`}
          className={cn('rounded-full border-2 border-devflow-card', index > 0 && '-ml-2')}
          title={assignee.name}
        >
          <Avatar name={assignee.name} color={assignee.color} size={size} />
        </div>
      ))}
      {extra > 0 ? (
        <div
          className="-ml-2 flex items-center justify-center rounded-full border-2 border-devflow-card bg-[var(--df-avatar-overflow-bg)] text-[10px] font-bold text-[var(--df-avatar-overflow-text)]"
          style={{ width: size, height: size }}
          title={tooltip}
        >
          +{extra}
        </div>
      ) : null}
    </div>
  )
}
