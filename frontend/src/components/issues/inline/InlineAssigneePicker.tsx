import { useMemo } from 'react'
import { UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { AssigneeAvatarStack } from '@/components/issues/AssigneeAvatarStack'
import { InlineDropdown } from '@/components/issues/inline/InlineDropdown'
import { INLINE_CELL_TRIGGER } from '@/components/issues/backlogTableLayout'
import { useProjectMembersData } from '@/hooks/useProjectMembersData'
import { mockMembers } from '@/services/mockMembers'
import type { IssueAssignee } from '@/types/issues'
import { colorForName, UNASSIGNED_ASSIGNEE } from '@/utils/assigneeColors'
import { cn } from '@/utils/cn'

export type AssigneeMember = {
  id: string
  name: string
  color: string
}

type InlineAssigneePickerProps = {
  projectId: string
  value: string | null
  assignee?: IssueAssignee
  assignees?: IssueAssignee[]
  assigneeIds?: string[]
  multiple?: boolean
  onChange: (userId: string | null, member?: AssigneeMember) => void
  onToggle?: (userId: string, member: AssigneeMember, selected: boolean) => void
  disabled?: boolean
  compact?: boolean
  cell?: boolean
  className?: string
}

function resolveMembers(): AssigneeMember[] {
  return mockMembers.map((member) => ({
    id: member.id,
    name: member.name,
    color: member.color,
  }))
}

export function useAssigneeMembers(projectId: string): AssigneeMember[] {
  const { members } = useProjectMembersData(projectId)

  return useMemo(() => {
    if (projectId && members.length > 0) {
      return members.map((member) => ({
        id: member.user_id,
        name: member.display_name || member.email || 'Member',
        color: colorForName(member.display_name || member.email || member.user_id),
      }))
    }
    return resolveMembers()
  }, [projectId, members])
}

export function InlineAssigneePicker({
  projectId,
  value,
  assignee,
  assignees,
  assigneeIds,
  multiple = false,
  onChange,
  onToggle,
  disabled = false,
  compact = false,
  cell = false,
  className,
}: InlineAssigneePickerProps) {
  const memberOptions = useAssigneeMembers(projectId)

  const displayAssignees = useMemo(() => {
    if (assignees && assignees.length > 0) return assignees
    if (assignee) return [assignee]
    const match = memberOptions.find((member) => member.id === value)
    if (match) return [{ name: match.name, color: match.color }]
    return [UNASSIGNED_ASSIGNEE]
  }, [assignee, assignees, memberOptions, value])

  const selectedIds = useMemo(() => {
    if (assigneeIds && assigneeIds.length > 0) return assigneeIds
    return value ? [value] : []
  }, [assigneeIds, value])

  const options = useMemo(
    () => [
      {
        id: '__unassigned__',
        label: 'Unassigned',
        icon: <UserRound className="size-4 text-devflow-text-muted" />,
      },
      ...memberOptions.map((member) => ({
        id: member.id,
        label: member.name,
        keywords: member.name,
        icon: <Avatar name={member.name} color={member.color} size={20} />,
      })),
    ],
    [memberOptions],
  )

  const handleSelect = (optionId: string) => {
    if (optionId === '__unassigned__') {
      onChange(null)
      return
    }

    const member = memberOptions.find((item) => item.id === optionId)
    if (!member) return

    if (multiple && onToggle) {
      const selected = selectedIds.includes(optionId)
      onToggle(optionId, member, !selected)
      return
    }

    onChange(optionId, member)
  }

  const tooltip =
    displayAssignees[0]?.name === 'Unassigned'
      ? 'Unassigned'
      : displayAssignees.map((item) => item.name).join(', ')

  return (
    <InlineDropdown
      className={className}
      disabled={disabled}
      fullWidth={cell}
      searchable
      searchPlaceholder="Search users…"
      options={options}
      onSelect={handleSelect}
      trigger={
        <span
          title={tooltip}
          className={cn(
            cell
              ? INLINE_CELL_TRIGGER
              : 'inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-devflow-muted/60',
            compact && !cell && 'px-1 py-0.5',
          )}
        >
          <AssigneeAvatarStack
            assignees={displayAssignees}
            size={cell || compact ? 18 : 20}
          />
          {!compact && !cell ? (
            <span className="max-w-[7rem] truncate text-caption text-devflow-text-secondary">
              {displayAssignees[0]?.name === 'Unassigned'
                ? 'Unassigned'
                : displayAssignees.map((item) => item.name).join(', ')}
            </span>
          ) : null}
        </span>
      }
    />
  )
}
