import { ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { WorkspaceMember } from '@/services/mockMembers'
import { cn } from '@/utils/cn'

type UserSelectFieldProps = {
  label: string
  users: WorkspaceMember[]
  value: string
  onChange: (userId: string) => void
  className?: string
}

export function UserSelectField({
  label,
  users,
  value,
  onChange,
  className,
}: UserSelectFieldProps) {
  const selected = users.find((u) => u.id === value)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor="project-lead"
        className="text-label text-devflow-text-secondary"
      >
        {label}
      </label>
      <div className="relative">
        {selected && (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
            <Avatar name={selected.name} color={selected.color} size={24} />
          </span>
        )}
        <select
          id="project-lead"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-devflow-border bg-devflow-surface py-2 pl-11 pr-9 text-input text-devflow-text outline-none transition-colors focus:border-devflow-primary focus:bg-devflow-card focus:ring-2 focus:ring-devflow-primary/20"
        >
          {users.map((user) => (
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
