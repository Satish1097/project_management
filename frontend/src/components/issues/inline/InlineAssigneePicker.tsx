import { useMemo } from 'react'

import { UserRound } from 'lucide-react'

import { UserAvatar } from '@/components/ui/UserAvatar'

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

  email?: string

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

    email: member.email,

  }))

}



export function useAssigneeMembers(projectId: string): AssigneeMember[] {

  const { members } = useProjectMembersData(projectId)



  return useMemo(() => {

    if (projectId && members.length > 0) {

      return members.map((member) => ({

        id: member.user_id,

        name: member.display_name || member.email || 'Member',

        email: member.email,

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

    if (value) {

      const match = memberOptions.find((member) => member.id === value)

      if (match) {

        return [{

          name: match.name,

          color: match.color,

          userId: match.id,

          email: match.email,

        }]

      }

    }

    if (assignee) {

      const userId = assignee.userId ?? value ?? undefined

      if (userId) {

        return [{ ...assignee, userId }]

      }

      if (assignee.name !== 'Unassigned') {

        return [assignee]

      }

    }

    return [UNASSIGNED_ASSIGNEE]

  }, [assignee, assignees, memberOptions, value])



  const selectedIds = useMemo(() => {

    if (assigneeIds && assigneeIds.length > 0) return assigneeIds

    return value ? [value] : []

  }, [assigneeIds, value])

  const displayAssigneeLabel = useMemo(() => {
    if (displayAssignees[0]?.name === 'Unassigned') return 'Unassigned'
    return displayAssignees
      .map((item) => item.email || item.name)
      .join(', ')
  }, [displayAssignees])



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

        description: member.email,

        keywords: `${member.name} ${member.email ?? ''}`.trim(),

        icon: (

          <UserAvatar

            name={member.name}

            color={member.color}

            size={20}

            userId={member.id}

            email={member.email}

            projectId={projectId}

            showHoverCard={false}

          />

        ),

      })),

    ],

    [memberOptions, projectId],

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



  return (

    <InlineDropdown

      className={className}

      disabled={disabled}

      fullWidth={cell || className?.includes('w-full')}

      searchable

      minWidth={240}

      searchPlaceholder="Search users…"

      options={options}

      selectedOptionId={value ?? '__unassigned__'}

      onSelect={handleSelect}

      trigger={

        <span

          className={cn(

            cell

              ? INLINE_CELL_TRIGGER

              : 'inline-flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-devflow-muted/60',

            compact && !cell && 'px-1 py-0.5',

          )}
          title={!compact && !cell ? displayAssigneeLabel : undefined}

        >

          <AssigneeAvatarStack

            assignees={displayAssignees}

            size={cell || compact ? 18 : 20}

            projectId={projectId}

          />

          {!compact && !cell ? (

            <span className="min-w-0 flex-1 truncate text-caption text-devflow-text-secondary">

              {displayAssignees[0]?.name === 'Unassigned'

                ? 'Unassigned'

                : displayAssigneeLabel}

            </span>

          ) : null}

        </span>

      }

    />

  )

}


