import {
  Building2,
  Check,
  ChevronDown,
  FolderKanban,
  Plus,
  Search,
} from 'lucide-react'
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
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
  open: boolean
  options: ContextOption[]
  query: string
  placeholder: string
  createLabel?: string
  onOpenChange: (open: boolean) => void
  onQueryChange: (value: string) => void
  onClose: () => void
  onChange: (id: string) => void
  onCreate?: () => void
  'aria-label': string
}

type ContextPopoverProps = {
  open: boolean
  anchorRef: RefObject<HTMLButtonElement | null>
  placement?: 'right' | 'bottom-start'
  title: string
  ariaLabel: string
  options: ContextOption[]
  selectedId: string
  query: string
  emptyLabel: string
  searchPlaceholder: string
  createLabel?: string
  onQueryChange: (query: string) => void
  onSelect: (id: string) => void
  onCreate?: () => void
  onClose: () => void
}

function ContextPopover({
  open,
  anchorRef,
  placement = 'right',
  title,
  ariaLabel,
  options,
  selectedId,
  query,
  emptyLabel,
  searchPlaceholder,
  createLabel,
  onQueryChange,
  onSelect,
  onCreate,
  onClose,
}: ContextPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const anchor = anchorRef.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      if (placement === 'bottom-start') {
        setPosition({
          top: rect.bottom + 8,
          left: rect.left,
        })
        return
      }

      setPosition({
        top: rect.top,
        left: rect.right + 12,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [anchorRef, open, placement])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      onClose()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchorRef, onClose, open])

  if (!open) return null

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={ariaLabel}
      className="sidebar-context-popover"
      style={{ top: position.top, left: position.left }}
    >
      <p className="sidebar-context-popover-title">{title}</p>

      <label className="sidebar-context-popover-search">
        <Search className="size-3.5 text-devflow-text-muted" aria-hidden />
        <span className="sr-only">{searchPlaceholder}</span>
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="sidebar-context-popover-search-input"
        />
      </label>

      <div className="sidebar-context-popover-list" role="listbox" aria-label={ariaLabel}>
        {options.length > 0 ? (
          options.map((option) => {
            const isActive = option.id === selectedId
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
                  onSelect(option.id)
                  onClose()
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
          })
        ) : (
          <p className="sidebar-context-popover-empty">{emptyLabel}</p>
        )}
      </div>

      {onCreate && createLabel ? (
        <div className="sidebar-context-popover-footer">
          <div className="sidebar-workspace-menu-divider" role="separator" />
          <button
            type="button"
            className="sidebar-workspace-menu-create"
            onClick={() => {
              onClose()
              onCreate()
            }}
          >
            <Plus className="size-3.5 shrink-0" aria-hidden />
            {createLabel}
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}

type ProjectSwitcherProps = {
  collapsed: boolean
  disabled: boolean
  open: boolean
  selectedProjectName: string
  selectedProjectId: string
  options: ContextOption[]
  query: string
  onOpenChange: (open: boolean) => void
  onClose: () => void
  onQueryChange: (value: string) => void
  onSelect: (projectId: string) => void
  onCreate?: () => void
}

function ProjectSwitcher({
  collapsed,
  disabled,
  open,
  selectedProjectName,
  selectedProjectId,
  options,
  query,
  onOpenChange,
  onClose,
  onQueryChange,
  onSelect,
  onCreate,
}: ProjectSwitcherProps) {
  const projectButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (disabled && open) onClose()
  }, [disabled, onClose, open])

  if (collapsed) {
    return (
      <>
        <button
          ref={projectButtonRef}
          type="button"
          title="Project"
          aria-label="Open project switcher"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'sidebar-nav-item sidebar-nav-item--collapsed sidebar-context-icon-trigger',
            open && 'sidebar-nav-item--active',
          )}
          onClick={() => onOpenChange(!open)}
        >
          <FolderKanban className="sidebar-nav-icon" strokeWidth={1.75} />
        </button>

        <ContextPopover
          open={open}
          anchorRef={projectButtonRef}
          title={selectedProjectName}
          ariaLabel="Project"
          options={options}
          selectedId={selectedProjectId}
          query={query}
          emptyLabel="No projects found"
          searchPlaceholder="Search projects"
          createLabel={onCreate ? 'Create Project' : undefined}
          onQueryChange={onQueryChange}
          onSelect={onSelect}
          onCreate={onCreate}
          onClose={onClose}
        />
      </>
    )
  }

  return (
    <div className="sidebar-context-selector sidebar-context-selector--menu">
      <span className="sidebar-context-label">Project</span>
      <button
        ref={projectButtonRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label="Project"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        className="sidebar-context-select-row w-full text-left"
      >
        <span
          className={cn(
            'sidebar-context-select truncate',
            !selectedProjectId && 'font-normal text-devflow-text-muted',
          )}
        >
          {selectedProjectId ? selectedProjectName : 'Select project'}
        </span>
        <ChevronDown className="sidebar-context-chevron" aria-hidden />
      </button>

      <ContextPopover
        open={open}
        placement="bottom-start"
        anchorRef={projectButtonRef}
        title={selectedProjectName}
        ariaLabel="Project"
        options={options}
        selectedId={selectedProjectId}
        query={query}
        emptyLabel="No projects found"
        searchPlaceholder="Search projects"
        createLabel={onCreate ? 'Create Project' : undefined}
        onQueryChange={onQueryChange}
        onSelect={onSelect}
        onCreate={onCreate}
        onClose={onClose}
      />
    </div>
  )
}

function ContextSelector({
  label,
  value,
  open,
  options,
  query,
  placeholder,
  createLabel,
  onOpenChange,
  onQueryChange,
  onClose,
  onChange,
  onCreate,
  'aria-label': ariaLabel,
}: ContextSelectorProps) {
  const selectorButtonRef = useRef<HTMLButtonElement>(null)
  const selected = options.find((option) => option.id === value)
  const displayValue = selected?.name ?? placeholder

  return (
    <div className="sidebar-context-selector sidebar-context-selector--menu">
      <span className="sidebar-context-label">{label}</span>
      <button
        ref={selectorButtonRef}
        type="button"
        onClick={() => onOpenChange(!open)}
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

      <ContextPopover
        open={open}
        placement="bottom-start"
        anchorRef={selectorButtonRef}
        title={displayValue}
        ariaLabel={ariaLabel}
        options={options}
        selectedId={value}
        query={query}
        emptyLabel="No workspaces found"
        searchPlaceholder="Search workspaces"
        createLabel={createLabel}
        onQueryChange={onQueryChange}
        onSelect={onChange}
        onCreate={onCreate}
        onClose={onClose}
      />
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
  const canCreateProjects =
    isSuperuser ||
    currentOrganization?.role === 'owner' ||
    currentOrganization?.role === 'admin' ||
    currentOrganization?.can_create_projects === true
  const orgOptions = organizations.map((org) => ({ id: org.id, name: org.name }))
  const projectOptions = projects.map((project) => ({
    id: project.id,
    name: project.name,
  }))
  const [openMenu, setOpenMenu] = useState<'workspace' | 'project' | null>(null)
  const [workspaceQuery, setWorkspaceQuery] = useState('')
  const [projectQuery, setProjectQuery] = useState('')
  const workspaceButtonRef = useRef<HTMLButtonElement>(null)

  const routeProjectId = parseProjectRoute(pathname).projectId
  const selectedProjectId = routeProjectId ?? selectedProject?.id ?? ''
  const selectedWorkspaceName =
    orgOptions.find((option) => option.id === (currentOrganization?.id ?? ''))?.name ??
    'Workspace'
  const selectedProjectName =
    projectOptions.find((option) => option.id === selectedProjectId)?.name ?? 'Project'
  const filteredWorkspaceOptions = useMemo(() => {
    const normalizedQuery = workspaceQuery.trim().toLowerCase()
    if (!normalizedQuery) return orgOptions
    return orgOptions.filter((option) =>
      option.name.toLowerCase().includes(normalizedQuery),
    )
  }, [orgOptions, workspaceQuery])
  const filteredProjectOptions = useMemo(() => {
    const normalizedQuery = projectQuery.trim().toLowerCase()
    if (!normalizedQuery) return projectOptions
    return projectOptions.filter((option) =>
      option.name.toLowerCase().includes(normalizedQuery),
    )
  }, [projectOptions, projectQuery])

  useEffect(() => {
    projectSwitchTrace.sidebarContextPanelMount(collapsed)
  }, [collapsed])

  const handleProjectCreated = (projectId: string) => {
    navigate(projectBacklogPath(projectId))
  }

  const openCreateProject = useCallback(() => {
    setCreateProjectOpen(true)
  }, [])

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
    label: 'Workspace',
    value: currentOrganization?.id ?? '',
    open: openMenu === 'workspace',
    options: orgOptions,
    query: workspaceQuery,
    placeholder: collapsed ? 'Workspace' : 'Select workspace',
    createLabel: isSuperuser ? 'Create Workspace' : undefined,
    onOpenChange: (open: boolean) => setOpenMenu(open ? 'workspace' : null),
    onQueryChange: setWorkspaceQuery,
    onClose: () => {
      setOpenMenu(null)
      setWorkspaceQuery('')
    },
    onChange: setCurrentOrganization,
    onCreate: isSuperuser ? () => setCreateOrgOpen(true) : undefined,
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
    return (
      <>
        <div className="sidebar-context-panel mt-2 items-center">
          <button
            ref={workspaceButtonRef}
            type="button"
            title="Workspace"
            aria-label="Open workspace switcher"
            aria-expanded={openMenu === 'workspace'}
            className={cn(
              'sidebar-nav-item sidebar-nav-item--collapsed sidebar-context-icon-trigger',
              openMenu === 'workspace' && 'sidebar-nav-item--active',
            )}
            onClick={() =>
              setOpenMenu((current) => (current === 'workspace' ? null : 'workspace'))
            }
          >
            <Building2 className="sidebar-nav-icon" strokeWidth={1.75} />
          </button>

          <ProjectSwitcher
            collapsed
            disabled={!currentOrganization}
            open={openMenu === 'project'}
            selectedProjectName={selectedProjectName}
            selectedProjectId={selectedProjectId}
            options={filteredProjectOptions}
            query={projectQuery}
            onOpenChange={(open) => setOpenMenu(open ? 'project' : null)}
            onClose={() => {
              setOpenMenu(null)
              setProjectQuery('')
            }}
            onQueryChange={setProjectQuery}
            onSelect={handleProjectChange}
            onCreate={
              currentOrganization && canCreateProjects ? openCreateProject : undefined
            }
          />
        </div>

        <ContextPopover
          open={openMenu === 'workspace'}
          anchorRef={workspaceButtonRef}
          title={selectedWorkspaceName}
          ariaLabel="Workspace"
          options={filteredWorkspaceOptions}
          selectedId={currentOrganization?.id ?? ''}
          query={workspaceQuery}
          emptyLabel="No workspaces found"
          searchPlaceholder="Search workspaces"
          createLabel={isSuperuser ? 'Create Workspace' : undefined}
          onQueryChange={setWorkspaceQuery}
          onSelect={setCurrentOrganization}
          onCreate={isSuperuser ? () => setCreateOrgOpen(true) : undefined}
          onClose={() => {
            setOpenMenu(null)
            setWorkspaceQuery('')
          }}
        />

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

  const showProjectSwitcher = Boolean(currentOrganization)

  return (
    <>
      <div className="sidebar-context-panel mt-3">
        <ContextSelector {...workspaceSelectorProps} />

        {showProjectSwitcher ? (
          <ProjectSwitcher
            collapsed={false}
            disabled={false}
            open={openMenu === 'project'}
            selectedProjectName={selectedProjectName}
            selectedProjectId={selectedProjectId}
            options={filteredProjectOptions}
            query={projectQuery}
            onOpenChange={(open) => setOpenMenu(open ? 'project' : null)}
            onClose={() => {
              setOpenMenu(null)
              setProjectQuery('')
            }}
            onQueryChange={setProjectQuery}
            onSelect={handleProjectChange}
            onCreate={canCreateProjects ? openCreateProject : undefined}
          />
        ) : (
          <ContextSelectorStatic
            label="Project"
            text="No project selected"
            placeholder
          />
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
