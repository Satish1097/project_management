import { useMemo, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import type { OrganizationMemberOption } from '@/hooks/useOrganizationMembers'
import { cn } from '@/utils/cn'

type UserSelectFieldProps = {
  label: string
  users: OrganizationMemberOption[]
  value: string
  onChange: (userId: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function UserSelectField({
  label,
  users,
  value,
  onChange,
  placeholder = 'Search members…',
  disabled = false,
  className,
}: UserSelectFieldProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = users.find((u) => u.id === value)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q),
    )
  }, [users, query])

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor="project-lead"
        className="text-label text-devflow-text-secondary"
      >
        {label}
      </label>
      <div className="relative">
        <button
          id="project-lead"
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2 text-left transition-colors',
            'focus:border-devflow-primary focus:bg-devflow-card focus:outline-none focus:ring-2 focus:ring-devflow-primary/20',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          {selected ? (
            <>
              <UserAvatar
                name={selected.name}
                color={selected.color}
                size={24}
                userId={selected.id}
                email={selected.email}
                role={selected.role}
                showHoverCard={false}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body text-devflow-text">
                  {selected.name}
                </span>
                <span className="block truncate text-caption text-devflow-text-muted">
                  {selected.email}
                </span>
              </span>
            </>
          ) : (
            <span className="flex-1 text-input text-devflow-text-muted">{placeholder}</span>
          )}
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-devflow-text-muted transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </button>

        {open && !disabled && (
          <>
            <div className="fixed inset-0 z-[110]" aria-hidden onClick={() => setOpen(false)} />
            <div className="absolute left-0 right-0 z-[120] mt-1 overflow-hidden rounded-lg border border-devflow-border bg-devflow-card shadow-devflow-md">
              <div className="border-b border-devflow-border p-2">
                <div className="flex items-center gap-2 rounded-md border border-devflow-border bg-devflow-surface px-2.5 py-1.5">
                  <Search className="size-4 text-devflow-text-muted" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-input text-devflow-text outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <ul className="max-h-44 overflow-y-auto py-1" role="listbox">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-caption text-devflow-text-muted">
                    No users found
                  </li>
                ) : (
                  filtered.map((user) => {
                    const isSelected = value === user.id
                    return (
                      <li key={user.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-devflow-surface"
                          onClick={() => {
                            onChange(user.id)
                            setOpen(false)
                          }}
                        >
                          <UserAvatar
                            name={user.name}
                            color={user.color}
                            size={28}
                            userId={user.id}
                            email={user.email}
                            role={user.role}
                            showHoverCard={false}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body text-devflow-text">
                              {user.name}
                            </span>
                            <span className="block truncate text-caption text-devflow-text-muted">
                              {user.email}
                            </span>
                          </span>
                          {isSelected && (
                            <Check className="size-4 shrink-0 text-devflow-primary" />
                          )}
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
