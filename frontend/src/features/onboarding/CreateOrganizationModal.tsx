import { useCallback, useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { createOrganization } from '@/api/organizations'
import { ApiError } from '@/api/types'
import { FormField } from '@/components/ui/FormField'
import {
  generateOrganizationSlug,
  isValidOrganizationSlug,
} from '@/utils/orgSlug'

type CreateOrganizationModalProps = {
  open: boolean
  ownerUserId: string
  onClose: () => void
  onCreated: (organizationId: string) => Promise<void>
}

export function CreateOrganizationModal({
  open,
  ownerUserId,
  onClose,
  onCreated,
}: CreateOrganizationModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setName('')
    setSlug('')
    setSlugTouched(false)
    setSubmitting(false)
    setSubmitAttempted(false)
    setSubmitError(null)
  }, [])

  useEffect(() => {
    if (!open) return
    resetForm()
  }, [open, resetForm])

  const nameError =
    submitAttempted && !name.trim() ? 'Organization name is required' : undefined
  const slugError =
    submitAttempted && !isValidOrganizationSlug(slug)
      ? 'Use 3–63 lowercase letters, numbers, or hyphens'
      : undefined

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) {
      setSlug(generateOrganizationSlug(value))
    }
  }

  const handleSubmit = async () => {
    setSubmitAttempted(true)
    setSubmitError(null)
    if (!name.trim() || !isValidOrganizationSlug(slug) || submitting) return

    setSubmitting(true)
    try {
      const organization = await createOrganization({
        name: name.trim(),
        slug,
        owner_user_id: ownerUserId,
      })
      await onCreated(organization.id)
      onClose()
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message)
      } else {
        setSubmitError('Failed to create organization. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-lg border border-devflow-border bg-devflow-card p-5 shadow-devflow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-section-title text-devflow-text">Create organization</h2>
            <p className="mt-1 text-caption text-devflow-text-muted">
              Set up your workspace to manage projects and teams.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-devflow-text-secondary hover:bg-devflow-surface"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <FormField
            label="Organization Name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            error={nameError}
            placeholder="DevFlow Org"
            disabled={submitting}
          />
          <FormField
            label="Slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value.toLowerCase())
            }}
            error={slugError}
            hint="Used in URLs (e.g. devflow-org)"
            disabled={submitting}
          />
          {submitError ? (
            <p className="text-caption text-devflow-error">{submitError}</p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-devflow-border bg-devflow-card px-3 py-1.5 text-btn text-devflow-text hover:bg-devflow-surface disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-devflow-primary px-3 py-1.5 text-btn text-white hover:bg-devflow-primary-hover disabled:opacity-50"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Create Organization
          </button>
        </div>
      </div>
    </div>
  )
}
