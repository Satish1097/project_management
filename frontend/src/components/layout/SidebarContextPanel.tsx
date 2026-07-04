import { Check, ChevronDown, Plus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  parseProjectRoute,
  projectBacklogPath,
  replaceProjectInPath,
} from '@/constants/routes'
import { useProjects } from '@/contexts/ProjectsContext'
import { setStoredOrganizationId } from '@/features/context/contextStorage'
import { useAppContext } from '@/features/context/useAppContext'
import { CreateOrganizationModal } from '@/features/onboarding/CreateOrganizationModal'
import { CreateProjectDrawer } from '@/features/projects/CreateProjectDrawer'
import { cn } from '@/utils/cn'
import { projectSwitchTrace } from '@/utils/projectSwitchTrace'

type SidebarContextPanelProps = {
  collapsed: boolean
}

type ContextOption = { id: string; name: string }

type ContextSelectorProps = {
  label: string
  value: string
  options: ContextOption[]
  placeholder: string
  onChange: (id: string) => void
  'aria-label': string
}

function ContextSelector({
  label,
  value,
  options,
  placeholder,
  onChange,
  'aria-label': ariaLabel,
}: ContextSelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.id === value)
  const displayValue = selected?.name ?? placeholder

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="sidebar-context-selector sidebar-context-selector--menu">
      <span className="sidebar-context-label">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="sidebar-context-select-row w-full text-left"
      >
        <span
          className={cn(
            'sidebar-context-select truncate',
            !selected && 'font-normal text-devflow-text-muted',
          )}
        >
          {displayValue}
        </span>
        <ChevronDown className="sidebar-context-chevron" aria-hidden />
      </button>

      {open ? (
        <div className="sidebar-workspace-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const isActive = option.id === value
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isActive}
                className={cn(
                  'sidebar-workspace-menu-item',
                  isActive && 'sidebar-workspace-menu-item--active',
                )}
                onClick={() => {
                  onChange(option.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'sidebar-workspace-menu-check',
                    !isActive && 'sidebar-workspace-menu-check--empty',
                  )}
                  aria-hidden
                />
                <span className="truncate">{option.name}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

type WorkspaceDropdownProps = {
  label?: string
  value: string
  options: ContextOption[]
  placeholder: string
  collapsed?: boolean
  onChange: (id: string) => void
  onCreateOrganization: () => void
  'aria-label': string
}

function WorkspaceDropdown({
  label = 'Workspace',
  value,
  options,
  placeholder,
  collapsed = false,
  onChange,
  onCreateOrganization,
  'aria-label': ariaLabel,
}: WorkspaceDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.id === value)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const displayValue = selected?.name ?? placeholder

  return (
    <div
      ref={containerRef}
      className={cn(
        'sidebar-context-selector sidebar-context-selector--menu',
        collapsed && 'sidebar-context-selector--collapsed',
      )}
    >
      {!collapsed ? (
        <span className="sidebar-context-label">{label}</span>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={collapsed ? displayValue : undefined}
        className={cn(
          'sidebar-context-select-row w-full text-left',
          collapsed && 'relative h-full w-full',
        )}
      >
        <span
          className={cn(
            'sidebar-context-select truncate',
            !selected && 'font-normal text-devflow-text-muted',
            collapsed && 'sr-only',
          )}
        >
          {displayValue}
        </span>
        <ChevronDown
          className={cn(
            'sidebar-context-chevron',
            collapsed && 'relative static translate-y-0',
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="sidebar-workspace-menu" role="listbox" aria-label={ariaLabel}>
          <p className="sidebar-workspace-menu-heading">Organizations</p>
          {options.map((option) => {
            const isActive = option.id === value
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isActive}
                className={cn(
                  'sidebar-workspace-menu-item',
                  isActive && 'sidebar-workspace-menu-item--active',
                )}
                onClick={() => {
                  onChange(option.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'sidebar-workspace-menu-check',
                    !isActive && 'sidebar-workspace-menu-check--empty',
                  )}
                  aria-hidden
                />
                <span className="truncate">{option.name}</span>
              </button>
            )
          })}
          <div className="sidebar-workspace-menu-divider" role="separator" />
          <button
            type="button"
            className="sidebar-workspace-menu-create"
            onClick={() => {
              setOpen(false)
              onCreateOrganization()
            }}
          >
            <Plus className="size-3.5 shrink-0" aria-hidden />
            Create Organization
          </button>
        </div>
      ) : null}
    </div>
  )
}

function ContextSelectorStatic({
  label,
  text,
  placeholder = false,
}: {
  label: string
  text: string
  placeholder?: boolean
}) {
  return (
    <div className="sidebar-context-selector">
      <span className="sidebar-context-label">{label}</span>
      <div className="sidebar-context-select-row">
        <span
          className={cn(
            'sidebar-context-value',
            placeholder && 'sidebar-context-value--placeholder',
          )}
        >
          {text}
        </span>
        <ChevronDown className="sidebar-context-chevron opacity-40" aria-hidden />
      </div>
    </div>
  )
}

function ContextSelectorSkeleton({ label }: { label: string }) {
  return (
    <div className="sidebar-context-selector" aria-hidden>
      <span className="sidebar-context-label">{label}</span>
      <div className="sidebar-context-select-row">
        <div className="h-[14px] w-3/4 animate-pulse rounded bg-devflow-muted" />
      </div>
    </div>
  )
}

function ContextSelectorCollapsed({
  value,
  options,
  placeholder,
  onChange,
  'aria-label': ariaLabel,
}: {
  value: string
  options: ContextOption[]
  placeholder: string
  onChange: (id: string) => void
  'aria-label': string
}) {
  const displayValue =
    options.find((option) => option.id === value)?.name ?? placeholder

  return (
    <div
      className="sidebar-context-selector sidebar-context-selector--collapsed"
      title={displayValue}
    >
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="sidebar-context-select sidebar-context-select--collapsed"
      >
        {!value && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <ChevronDown className="size-3 shrink-0 text-devflow-text-muted" aria-hidden />
    </div>
  )
}

export function SidebarContextPanel({ collapsed }: SidebarContextPanelProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname } = location
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const {
    user,
    organizations,
    currentOrganization,
    currentProject: selectedProject,
    setCurrentOrganization,
    refreshContext,
    isLoading: contextLoading,
  } = useAppContext()
  const { projects, isLoading: projectsLoading } = useProjects()
  const isLoading = contextLoading || (Boolean(currentOrganization) && projectsLoading)
  const isSuperuser = user?.is_superuser === true
  const orgOptions = organizations.map((org) => ({ id: org.id, name: org.name }))

  const routeProjectId = parseProjectRoute(pathname).projectId
  const selectedProjectId = routeProjectId ?? selectedProject?.id ?? ''

  useEffect(() => {
    projectSwitchTrace.sidebarContextPanelMount(collapsed)
  }, [collapsed])

  const handleProjectCreated = (projectId: string) => {
    navigate(projectBacklogPath(projectId))
  }

  const handleProjectChange = useCallback(
    (projectId: string) => {
      const nextPathname = replaceProjectInPath(pathname, projectId)
      const willNavigate = nextPathname !== pathname
      projectSwitchTrace.handleProjectChange(
        projectId,
        pathname,
        nextPathname,
        willNavigate,
      )
      if (!willNavigate) return

      const target = `${nextPathname}${location.search}${location.hash}`
      projectSwitchTrace.navigateCalled('SidebarContextPanel.tsx', target, true)
      navigate(target, { replace: true })
    },
    [location.hash, location.search, navigate, pathname],
  )

  const handleOrganizationCreated = useCallback(
    async (organizationId: string) => {
      setStoredOrganizationId(organizationId)
      await refreshContext()
    },
    [refreshContext],
  )

  const workspaceSelectorProps = {
    value: currentOrganization?.id ?? '',
    options: orgOptions,
    placeholder: collapsed ? 'Workspace' : 'Select workspace',
    onChange: setCurrentOrganization,
    onCreateOrganization: () => setCreateOrgOpen(true),
    'aria-label': 'Workspace',
  }

  if (collapsed) {
    if (isLoading) {
      return (
        <div className="sidebar-context-panel sidebar-context-panel--single mt-2 items-center">
          <div
            className="sidebar-context-selector sidebar-context-selector--collapsed animate-pulse bg-devflow-muted"
            aria-hidden
          />
        </div>
      )
    }

    if (organizations.length === 0) {
      return null
    }

    return (
      <>
        <div className="sidebar-context-panel mt-2 items-center">
          {isSuperuser ? (
            <WorkspaceDropdown {...workspaceSelectorProps} collapsed />
          ) : (
            <ContextSelectorCollapsed {...workspaceSelectorProps} />
          )}
          {currentOrganization && projects.length > 0 && (
            <ContextSelectorCollapsed
              value={selectedProjectId}
              options={projects.map((project) => ({
                id: project.id,
                name: project.name,
              }))}
              placeholder="Project"
              onChange={handleProjectChange}
              aria-label="Project"
            />
          )}
        </div>

        {isSuperuser && user ? (
          <CreateOrganizationModal
            open={createOrgOpen}
            ownerUserId={user.id}
            onClose={() => setCreateOrgOpen(false)}
            onCreated={handleOrganizationCreated}
          />
        ) : null}
      </>
    )
  }

  if (isLoading) {
    return (
      <div className="sidebar-context-panel mt-3">
        <ContextSelectorSkeleton label="Workspace" />
        <ContextSelectorSkeleton label="Project" />
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="sidebar-context-panel sidebar-context-panel--single mt-3">
        <ContextSelectorStatic
          label="Workspace"
          text="No organization"
          placeholder
        />
      </div>
    )
  }

  const showCreateProject = currentOrganization && projects.length === 0

  return (
    <>
      <div className="sidebar-context-panel mt-3">
        {isSuperuser ? (
          <WorkspaceDropdown {...workspaceSelectorProps} />
        ) : (
          <ContextSelector
            label="Workspace"
            value={workspaceSelectorProps.value}
            options={workspaceSelectorProps.options}
            placeholder={workspaceSelectorProps.placeholder}
            onChange={workspaceSelectorProps.onChange}
            aria-label={workspaceSelectorProps['aria-label']}
          />
        )}

        {currentOrganization && projects.length > 0 ? (
          <ContextSelector
            label="Project"
            value={selectedProjectId}
            options={projects.map((project) => ({
              id: project.id,
              name: project.name,
            }))}
            placeholder="Select project"
            onChange={handleProjectChange}
            aria-label="Project"
          />
        ) : (
          <ContextSelectorStatic
            label="Project"
            text="No project selected"
            placeholder
          />
        )}

        {showCreateProject && (
          <button
            type="button"
            onClick={() => setCreateProjectOpen(true)}
            className="sidebar-context-create-btn"
          >
            Create Project
          </button>
        )}
      </div>

      <CreateProjectDrawer
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onCreated={handleProjectCreated}
      />

      {isSuperuser && user ? (
        <CreateOrganizationModal
          open={createOrgOpen}
          ownerUserId={user.id}
          onClose={() => setCreateOrgOpen(false)}
          onCreated={handleOrganizationCreated}
        />
      ) : null}
    </>
  )
}
