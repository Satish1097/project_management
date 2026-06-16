import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { getProjectMembers, type ProjectMemberRecord } from '@/api/members'
import { Avatar } from '@/components/ui/Avatar'
import { mockMembers } from '@/services/mockMembers'
import { cn } from '@/utils/cn'

type AssigneeSelectProps = {
  value: string
  onChange: (userId: string) => void
  className?: string
  projectId?: string
}

const MEMBER_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#6366f1',
]

function colorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length]
}

export function AssigneeSelect({
  value,
  onChange,
  className,
  projectId,
}: AssigneeSelectProps) {
  const [members, setMembers] = useState<ProjectMemberRecord[]>([])

  useEffect(() => {
    if (!projectId) return

    let cancelled = false
    void getProjectMembers(projectId).then((data) => {
      if (!cancelled) setMembers(data)
    })

    return () => {
      cancelled = true
    }
  }, [projectId])

  const options = useMemo(() => {
    if (projectId && members.length > 0) {
      return members.map((member) => ({
        id: member.user_id,
        name: member.display_name || member.email || 'Member',
        color: colorForName(member.display_name || member.email || member.user_id),
      }))
    }
    return mockMembers
  }, [projectId, members])

  const selected = options.find((member) => member.id === value)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor="issue-assignee" className="text-label text-devflow-text-secondary">
        Assignee
      </label>
      <div className="relative">
        {selected ? (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
            <Avatar name={selected.name} color={selected.color} size={24} />
          </span>
        ) : null}
        <select
          id="issue-assignee"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full appearance-none rounded-lg border border-devflow-border bg-devflow-surface py-2 pr-9 text-input text-devflow-text outline-none focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20',
            selected ? 'pl-11' : 'pl-3',
          )}
        >
          <option value="">Unassigned</option>
          {options.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-devflow-text-muted"
          aria-hidden
        />
      </div>
    </div>
  )
}
