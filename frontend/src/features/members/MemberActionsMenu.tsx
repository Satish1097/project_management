import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, MoreHorizontal, X } from 'lucide-react'
import {
  removeProjectMember,
  updateProjectMemberRole,
  type ProjectMemberRecord,
} from '@/api/members'
import { ApiError } from '@/api/types'
import { RadioOptionGroup } from '@/components/ui/RadioOptionGroup'
import {
  PROJECT_ROLES,
  getMemberDisplayName,
} from '@/features/members/memberUtils'

const DROPDOWN_WIDTH = 176
const DROPDOWN_GAP = 4
const VIEWPORT_MARGIN = 8

type MemberActionsMenuProps = {
  member: ProjectMemberRecord
  projectId: string
  onUpdated: () => void | Promise<void>
}

type ActiveDialog = 'change-role' | 'remove' | 'coming-soon' | null

function isApiNotImplementedError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 501)
}

export function MemberActionsMenu({
  member,
  projectId,
  onUpdated,
}: MemberActionsMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null)
  const [selectedRole, setSelectedRole] = useState(member.role)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const displayName = getMemberDisplayName(member)

  useLayoutEffect(() => {
    if (!menuOpen || !buttonRef.current) return
    setAnchorRect(buttonRef.current.getBoundingClientRect())
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setMenuOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    function handleScroll() {
      setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [menuOpen])

  useEffect(() => {
    if (activeDialog === 'change-role') {
      setSelectedRole(member.role)
      setActionError(null)
    }
  }, [activeDialog, member.role])

  const closeDialog = () => {
    if (submitting) return
    setActiveDialog(null)
    setActionError(null)
  }

  const openChangeRole = () => {
    setMenuOpen(false)
    setActiveDialog('change-role')
  }

  const openRemove = () => {
    setMenuOpen(false)
    setActiveDialog('remove')
  }

  const handleSaveRole = async () => {
    if (submitting) return
    setSubmitting(true)
    setActionError(null)

    try {
      await updateProjectMemberRole(projectId, member.user_id, selectedRole)
      await onUpdated()
      setActiveDialog(null)
    } catch (error) {
      if (isApiNotImplementedError(error)) {
        setActiveDialog('coming-soon')
      } else {
        setActionError(
          error instanceof ApiError ? error.message : 'Failed to update role.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmRemove = async () => {
    if (submitting) return
    setSubmitting(true)
    setActionError(null)

    try {
      await removeProjectMember(projectId, member.user_id)
      await onUpdated()
      setActiveDialog(null)
    } catch (error) {
      if (isApiNotImplementedError(error)) {
        setActiveDialog('coming-soon')
      } else {
        setActionError(
          error instanceof ApiError ? error.message : 'Failed to remove member.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const dropdownPosition = anchorRect
    ? {
        top: anchorRect.bottom + DROPDOWN_GAP,
        left: Math.min(
          Math.max(VIEWPORT_MARGIN, anchorRect.right - DROPDOWN_WIDTH),
          window.innerWidth - DROPDOWN_WIDTH - VIEWPORT_MARGIN,
        ),
      }
    : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="text-devflow-text-secondary"
        aria-label={`Actions for ${displayName}`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation()
          setMenuOpen((open) => !open)
        }}
      >
        <MoreHorizontal className="size-5" />
      </button>

      {menuOpen && dropdownPosition
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-[100] min-w-[11rem] rounded-lg border border-devflow-border bg-devflow-card p-1 shadow-devflow-md"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: DROPDOWN_WIDTH,
              }}
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-body text-devflow-text hover:bg-devflow-muted"
                onClick={openChangeRole}
              >
                Change Role
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-body text-red-600 hover:bg-devflow-muted"
                onClick={openRemove}
              >
                Remove Member
              </button>
            </div>,
            document.body,
          )
        : null}

      {activeDialog === 'change-role'
        ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                aria-label="Close"
                onClick={closeDialog}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-role-title"
                className="relative w-full max-w-[42rem] rounded-lg border border-devflow-border bg-devflow-card p-5 shadow-devflow-lg"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2
                      id="change-role-title"
                      className="text-section-title text-devflow-text"
                    >
                      Change Role
                    </h2>
                    <p className="mt-1 text-body text-devflow-text-secondary">
                      Update the role for {displayName}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="rounded-lg p-1.5 text-devflow-text-secondary hover:bg-devflow-surface"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <RadioOptionGroup
                  name={`member-role-${member.user_id}`}
                  label="Project role"
                  value={selectedRole}
                  onChange={setSelectedRole}
                  layout="grid"
                  options={PROJECT_ROLES.map((role) => ({
                    value: role.value,
                    label: role.label,
                  }))}
                />

                {actionError ? (
                  <p className="mt-3 text-body text-red-600">{actionError}</p>
                ) : null}

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={submitting}
                    className="rounded-lg border border-devflow-border px-4 py-2 text-btn text-devflow-text hover:bg-devflow-surface disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveRole()}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm hover:opacity-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {activeDialog === 'remove'
        ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                aria-label="Close"
                onClick={closeDialog}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="remove-member-title"
                className="relative w-full max-w-md rounded-lg border border-devflow-border bg-devflow-card p-5 shadow-devflow-lg"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2
                      id="remove-member-title"
                      className="text-section-title text-devflow-text"
                    >
                      Remove Member
                    </h2>
                    <p className="mt-1 text-body text-devflow-text-secondary">
                      Remove {displayName} from this project? They will lose access
                      immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="rounded-lg p-1.5 text-devflow-text-secondary hover:bg-devflow-surface"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {actionError ? (
                  <p className="mb-3 text-body text-red-600">{actionError}</p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={submitting}
                    className="rounded-lg border border-devflow-border px-4 py-2 text-btn text-devflow-text hover:bg-devflow-surface disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleConfirmRemove()}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-btn text-white shadow-devflow-sm hover:opacity-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Removing…
                      </>
                    ) : (
                      'Remove Member'
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {activeDialog === 'coming-soon'
        ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                aria-label="Close"
                onClick={closeDialog}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="coming-soon-title"
                className="relative w-full max-w-sm rounded-lg border border-devflow-border bg-devflow-card p-5 shadow-devflow-lg"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2
                      id="coming-soon-title"
                      className="text-section-title text-devflow-text"
                    >
                      Coming Soon
                    </h2>
                    <p className="mt-1 text-body text-devflow-text-secondary">
                      This action is not available yet. Check back in a future update.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="rounded-lg p-1.5 text-devflow-text-secondary hover:bg-devflow-surface"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm hover:opacity-95"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
