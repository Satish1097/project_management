import { ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { mockMembers } from '@/services/mockMembers'
import { cn } from '@/utils/cn'

type AssigneeSelectProps = {
  value: string
  onChange: (userId: string) => void
  className?: string
}

export function AssigneeSelect({ value, onChange, className }: AssigneeSelectProps) {
  const selected = mockMembers.find((m) => m.id === value)

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
          {mockMembers.map((user) => (
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
