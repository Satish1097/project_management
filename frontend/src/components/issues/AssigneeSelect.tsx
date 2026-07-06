import {
  InlineAssigneePicker,
  useAssigneeMembers,
} from '@/components/issues/inline/InlineAssigneePicker'
import { cn } from '@/utils/cn'

type AssigneeSelectProps = {
  value: string
  onChange: (userId: string) => void
  className?: string
  projectId?: string
}

export function AssigneeSelect({
  value,
  onChange,
  className,
  projectId,
}: AssigneeSelectProps) {
  const memberOptions = useAssigneeMembers(projectId ?? '')
  const selected = memberOptions.find((member) => member.id === value)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-label text-devflow-text-secondary">Assignee</span>
      <InlineAssigneePicker
        projectId={projectId ?? ''}
        value={value || null}
        assignee={
          selected ? { name: selected.name, color: selected.color, userId: selected.id } : undefined
        }
        className="w-full"
        onChange={(userId, member) => {
          onChange(userId ?? '')
          void member
        }}
      />
    </div>
  )
}

/** Inline assignee field for drawers and compact surfaces. */
export function AssigneeField({
  projectId,
  value,
  onChange,
  className,
}: {
  projectId: string
  value: string | null
  onChange: (userId: string | null) => void
  className?: string
}) {
  const members = useAssigneeMembers(projectId)
  const member = members.find((item) => item.id === value)

  return (
    <InlineAssigneePicker
      projectId={projectId}
      value={value}
      assignee={
        member ? { name: member.name, color: member.color, userId: member.id } : undefined
      }
      className={className}
      onChange={(userId) => onChange(userId)}
    />
  )
}
