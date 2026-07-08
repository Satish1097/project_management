import { useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import type { OrganizationMemberOption } from '@/hooks/useOrganizationMembers'
import { cn } from '@/utils/cn'

type UserMultiSelectProps = {
  label: string
  hint?: string
  users: OrganizationMemberOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  excludeIds?: string[]
  placeholder?: string
}

export function UserMultiSelect({
  label,
  hint,
  users,
  selectedIds,
  onChange,
  excludeIds = [],
  placeholder = 'Search team members…',
}: UserMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const available = useMemo(
    () => users.filter((u) => !excludeIds.includes(u.id)),
    [users, excludeIds],
  )

  const selectedUsers = useMemo(
    () => available.filter((u) => selectedIds.includes(u.id)),
    [available, selectedIds],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return available
    return available.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [available, query])

  const toggleUser = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    )
  }

  const removeUser = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id))
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <span className="text-label text-devflow-text-secondary">{label}</span>

      <div
        className={cn(
          'rounded-lg border border-devflow-border bg-devflow-surface transition-colors',
          open && 'border-devflow-primary ring-2 ring-devflow-primary/20',
        )}
      >
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-devflow-border px-2 py-2">
            {selectedUsers.map((user) => (
              <span
                key={user.id}
                className="inline-flex items-center gap-1 rounded-md bg-devflow-card py-0.5 pl-0.5 pr-1.5 text-caption text-devflow-text shadow-devflow-sm"
              >
                <UserAvatar
                  name={user.name}
                  color={user.color}
                  size={20}
                  userId={user.id}
                  email={user.email}
                  role={user.role}
                />
                <span className="max-w-[8rem] truncate">{user.name.split(' ')[0]}</span>
                <button
                  type="button"
                  onClick={() => removeUser(user.id)}
                  className="rounded p-0.5 text-devflow-text-muted hover:bg-devflow-surface hover:text-devflow-text"
                  aria-label={`Remove ${user.name}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <Search className="size-4 shrink-0 text-devflow-text-muted" />
          <span className="flex-1 text-input text-devflow-text-muted">
            {selectedUsers.length === 0 ? placeholder : 'Add more members…'}
          </span>
          <ChevronDown
            className={cn(
              'size-4 text-devflow-text-muted transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[110]"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 z-[120] mt-1 overflow-hidden rounded-lg border border-devflow-border bg-devflow-card shadow-devflow-md">
            <div className="border-b border-devflow-border p-2">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-devflow-border bg-devflow-surface px-2.5 py-1.5 text-input text-devflow-text outline-none focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20"
                autoFocus
              />
            </div>
            <ul
              className="max-h-44 overflow-y-auto py-1"
              role="listbox"
              aria-multiselectable
            >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-caption text-devflow-text-muted">
                No users found
              </li>
            ) : (
              filtered.map((user) => {
                const selected = selectedIds.includes(user.id)
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-devflow-surface"
                      onClick={() => toggleUser(user.id)}
                    >
                      <UserAvatar
                        name={user.name}
                        color={user.color}
                        size={28}
                        userId={user.id}
                        email={user.email}
                        role={user.role}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body text-devflow-text">
                          {user.name}
                        </span>
                        <span className="block truncate text-caption text-devflow-text-muted">
                          {user.email}
                        </span>
                      </span>
                      {selected && (
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

      {hint && (
        <p className="text-caption text-devflow-text-muted">{hint}</p>
      )}
    </div>
  )
}
