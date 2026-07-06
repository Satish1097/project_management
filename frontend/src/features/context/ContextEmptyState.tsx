import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

type ContextEmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export function ContextEmptyState({ title, description, action }: ContextEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md rounded-lg border border-dashed border-devflow-border bg-[var(--df-empty-state)] px-6 py-10 text-center">
        <p className="text-section-title text-devflow-text">{title}</p>
        {description ? (
          <p className="mt-2 text-body text-devflow-text-secondary">{description}</p>
        ) : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  )
}

export function NoOrganizationState() {
  return (
    <ContextEmptyState
      title="No organization assigned"
      description="Contact your administrator."
    />
  )
}

export function SuperuserNoOrganizationState({
  onCreateOrganization,
}: {
  onCreateOrganization: () => void
}) {
  return (
    <ContextEmptyState
      title="Welcome to HKPMS"
      description="You don't have any organization yet. Create your first organization to start managing projects, sprints, and teams."
      action={
        <Button className="w-auto px-4" onClick={onCreateOrganization}>
          Create Organization
        </Button>
      }
    />
  )
}

export function NoProjectState() {
  return (
    <ContextEmptyState
      title="No project assigned"
      description=""
    />
  )
}

export function NoProjectsOnboardingState({
  onCreateProject,
}: {
  onCreateProject: () => void
}) {
  return (
    <ContextEmptyState
      title="You're all set"
      description="Create your first project to begin planning work."
      action={
        <Button className="w-auto px-4" onClick={onCreateProject}>
          Create Project
        </Button>
      }
    />
  )
}

export function ContextLoadErrorState({ message }: { message: string }) {
  return (
    <ContextEmptyState
      title="Unable to load workspace"
      description={message}
    />
  )
}
