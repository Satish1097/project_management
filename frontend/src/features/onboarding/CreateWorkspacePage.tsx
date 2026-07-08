import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrganization } from '@/api/organizations'
import { ApiError } from '@/api/types'
import { AppLogo } from '@/components/brand/AppLogo'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { ROUTES } from '@/constants/routes'
import { setStoredOrganizationId } from '@/features/context/contextStorage'
import { useAppContext } from '@/features/context/useAppContext'
import {
  generateOrganizationSlug,
  isValidOrganizationSlug,
} from '@/utils/orgSlug'

export function CreateWorkspacePage() {
  const navigate = useNavigate()
  const {
    user,
    organizations,
    isLoading: contextLoading,
    refreshContext,
  } = useAppContext()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameError =
    submitAttempted && !name.trim() ? 'Workspace name is required' : undefined
  const slugError =
    submitAttempted && !isValidOrganizationSlug(slug)
      ? 'Use 3-63 lowercase letters, numbers, or hyphens'
      : undefined

  useEffect(() => {
    if (!contextLoading && organizations.length > 0) {
      navigate(ROUTES.dashboard, { replace: true })
    }
  }, [contextLoading, navigate, organizations.length])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(generateOrganizationSlug(value))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitAttempted(true)
    setError(null)

    if (!user || !name.trim() || !isValidOrganizationSlug(slug) || submitting) {
      return
    }

    setSubmitting(true)
    try {
      const organization = await createOrganization({
        name: name.trim(),
        slug,
        owner_user_id: user.id,
      })
      setStoredOrganizationId(organization.id)
      await refreshContext()
      navigate(ROUTES.dashboard, { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to create workspace. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (contextLoading || !user || organizations.length > 0) {
    return null
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-devflow-surface p-6">
      <section className="w-full max-w-md rounded-lg border border-devflow-border bg-devflow-card p-6 shadow-devflow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-10 items-center justify-center overflow-hidden rounded-full">
            <AppLogo className="size-10" />
          </div>
          <h1 className="text-page-title text-devflow-text">Create Workspace</h1>
          <p className="mt-2 text-body text-devflow-text-secondary">
            Set up your workspace to manage projects and invite your team.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <FormField
            label="Workspace Name"
            required
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            error={nameError}
            placeholder="Acme Product Team"
            disabled={submitting}
          />
          <FormField
            label="Slug"
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true)
              setSlug(event.target.value.toLowerCase())
            }}
            error={slugError}
            hint="Used in URLs, for example acme-product"
            disabled={submitting}
          />

          {error ? <p className="text-caption text-devflow-error">{error}</p> : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating workspace...' : 'Create Workspace'}
          </Button>
        </form>
      </section>
    </main>
  )
}
