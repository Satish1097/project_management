import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  Calendar,
  Check,
  ChevronDown,
  ListChecks,
  Maximize2,
  MessageSquare,
  Plus,
  X,
} from 'lucide-react'
import { AssigneeSelect } from '@/components/issues/AssigneeSelect'
import { AttachmentDropzone } from '@/components/issues/AttachmentDropzone'
import { IssuePrioritySelect } from '@/components/issues/IssuePrioritySelect'
import { LabelMultiSelect } from '@/components/issues/LabelMultiSelect'
import { Avatar } from '@/components/ui/Avatar'
import { IssueStatusBadge } from '@/components/ui/IssueStatusBadge'
import { LabelBadge } from '@/components/ui/LabelBadge'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { SelectField } from '@/components/ui/SelectField'
import {
  ISSUE_STATUS_OPTIONS,
  STORY_POINT_OPTIONS,
} from '@/constants/issueOptions'
import { getIssue as apiGetIssue } from '@/api/issues'
import { ApiError } from '@/api/types'
import { refreshKanbanBoard } from '@/features/kanban/kanbanRefreshBridge'
import { useIssues } from '@/contexts/IssuesContext'
import {
  getIssueDetailExtras,
  updateIssueDetailExtras,
} from '@/services/issueDetailStore'
import { getIssueById, updateIssueInRegistry } from '@/services/issuesRegistry'
import { isApiIssueId, mapIssueDetailToUi } from '@/services/mapIssueApi'
import { getProjectById, getSprintById } from '@/services/projectData'
import { mockMembers } from '@/services/mockMembers'
import type { IssueDetailExtras, IssueComment } from '@/types/issueDetail'
import type {
  IssuePriorityLevel,
  IssueWorkflowStatus,
  ProjectIssue,
} from '@/types/issues'
import type { TaskStatus } from '@/types/tasks'
import { cn } from '@/utils/cn'

type IssueDetailDrawerProps = {
  open: boolean
  issue: ProjectIssue | null
  onClose: () => void
  onIssueUpdated: (issue: ProjectIssue) => void
}

type DetailTab = 'details' | 'activity' | 'comments' | 'attachments' | 'subtasks'

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'activity', label: 'Activity' },
  { id: 'comments', label: 'Comments' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'subtasks', label: 'Subtasks' },
]

function workflowToTaskStatus(status?: IssueWorkflowStatus): TaskStatus {
  switch (status) {
    case 'backlog':
      return 'backlog'
    case 'review':
      return 'review'
    case 'testing':
      return 'testing'
    case 'blocked':
      return 'blocked'
    case 'done':
      return 'done'
    case 'in_progress':
      return 'in_progress'
    default:
      return 'todo'
  }
}

function priorityForBadge(issue: ProjectIssue): 'high' | 'medium' | 'low' {
  if (issue.priority) return issue.priority
  const level = issue.priorityLevel
  if (level === 'high' || level === 'critical' || level === 'blocker') return 'high'
  if (level === 'low' || level === 'lowest') return 'low'
  return 'medium'
}

function memberIdFromAssignee(issue: ProjectIssue): string {
  if (issue.assigneeId) return issue.assigneeId
  return mockMembers.find((m) => m.name === issue.assignee.name)?.id ?? ''
}

export function IssueDetailDrawer({
  open,
  issue,
  onClose,
  onIssueUpdated,
}: IssueDetailDrawerProps) {
  const { updateIssue, refresh, updateIssueViaApi, loadBacklog, loadSprintIssues } = useIssues()
  const titleId = useId()
  const [tab, setTab] = useState<DetailTab>('details')
  const [extras, setExtras] = useState<IssueDetailExtras | null>(null)
  const [draft, setDraft] = useState<ProjectIssue | null>(null)
  const [dirty, setDirty] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialSnapshotRef = useRef('')
  const loadedWorkflowStatusRef = useRef<IssueWorkflowStatus | undefined>(undefined)

  const persisted = useMemo(
    () => Boolean(draft?.id && isApiIssueId(draft.id)),
    [draft?.id],
  )

  useEffect(() => {
    if (!open || !issue) return
    setTab('details')
    setCommentDraft('')
    setNewSubtask('')
    setSaveError(null)

    if (isApiIssueId(issue.id)) {
      setDetailLoading(true)
      void apiGetIssue(issue.id)
        .then((detail) => {
          const mapped = mapIssueDetailToUi(detail, issue.projectId)
          loadedWorkflowStatusRef.current = mapped.workflowStatus
          setDraft(mapped)
          setExtras({
            description: detail.description ?? '',
            acceptanceCriteria: '',
            epic: mapped.key.split('-')[0] + '-EPIC-1',
            reporter: mapped.assignee,
            createdBy: detail.reporter ?? 'Unknown',
            createdAt: new Date(detail.created_at).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
            updatedAt: new Date(detail.updated_at).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
            activity: [],
            comments: [],
            subtasks: [],
          })
          setDirty(false)
          initialSnapshotRef.current = JSON.stringify({ issue: mapped })
        })
        .catch((error: unknown) => {
          const message =
            error instanceof ApiError ? error.message : 'Failed to load issue.'
          setSaveError(message)
          setDraft({ ...issue })
          setExtras(getIssueDetailExtras(issue))
        })
        .finally(() => {
          setDetailLoading(false)
        })
      return
    }

    const detail = getIssueDetailExtras(issue)
    loadedWorkflowStatusRef.current = issue.workflowStatus
    setExtras(detail)
    setDraft({ ...issue })
    setDirty(false)
    initialSnapshotRef.current = JSON.stringify({ issue, detail })
  }, [open, issue])

  const requestClose = useCallback(() => {
    if (dirty) {
      const leave = window.confirm(
        'You have unsaved changes. Close without saving?',
      )
      if (!leave) return
    }
    onClose()
  }, [dirty, onClose])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, requestClose])

  const saveChanges = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (!draft || !extras) return

    if (persisted) {
      setSaving(true)
      setSaveError(null)
      try {
        const updated = await updateIssueViaApi(draft.id, draft.projectId, {
          title: draft.title.trim(),
          description: extras.description.trim(),
          type: draft.issueType,
          priority: draft.priorityLevel ?? 'medium',
          sprint: draft.sprintId,
          assignee: memberIdFromAssignee(draft) || null,
          story_points: draft.storyPoints ?? null,
          due_date: draft.dueDate || null,
          estimate_hours: draft.estimateHours ?? null,
          labels: draft.labelIds ?? [],
        })
        await loadBacklog(draft.projectId)
        if (draft.sprintId) {
          await loadSprintIssues(draft.projectId, draft.sprintId)
        }
        refreshKanbanBoard()
        loadedWorkflowStatusRef.current = updated.workflowStatus
        onIssueUpdated(updated)
        setDraft(updated)
        setDirty(false)
        initialSnapshotRef.current = JSON.stringify({ issue: updated })
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Failed to save issue.'
        setSaveError(message)
      } finally {
        setSaving(false)
      }
      return
    }

    updateIssue(draft.id, draft)
    updateIssueInRegistry(draft.id, draft)
    refresh()
    updateIssueDetailExtras(draft.id, extras)
    const latest = getIssueById(draft.id) ?? draft
    onIssueUpdated(latest)
    setDirty(false)
    initialSnapshotRef.current = JSON.stringify({ issue: latest, detail: extras })
  }, [
    draft,
    extras,
    persisted,
    updateIssue,
    refresh,
    updateIssueViaApi,
    loadBacklog,
    loadSprintIssues,
    onIssueUpdated,
  ])

  const patchDraft = useCallback((patch: Partial<ProjectIssue>) => {
    setDraft((prev) => {
      if (!prev) return prev
      setDirty(true)
      return { ...prev, ...patch }
    })
  }, [])

  const patchExtras = useCallback(
    (patch: Partial<IssueDetailExtras>) => {
      if (!draft) return
      setExtras((prev) => {
        if (!prev) return prev
        const next = { ...prev, ...patch }
        setDirty(true)
        return next
      })
    },
    [draft],
  )

  const handleDelete = useCallback(() => {
    if (!draft) return
    if (
      !window.confirm(
        `Delete ${draft.key}? This action cannot be undone in this demo.`,
      )
    ) {
      return
    }
    onClose()
  }, [draft, onClose])

  const addComment = useCallback(() => {
    if (!draft || !extras || !commentDraft.trim()) return
    const author = draft.assignee
    const entry: IssueComment = {
      id: `${draft.id}-c-${Date.now()}`,
      author,
      body: commentDraft.trim(),
      timestamp: 'Just now',
    }
    const activity = [
      {
        id: `${draft.id}-a-${Date.now()}`,
        type: 'comment_added' as const,
        actor: author,
        message: 'added a comment',
        timestamp: 'Just now',
      },
      ...extras.activity,
    ]
    patchExtras({
      comments: [...extras.comments, entry],
      activity,
    })
    setCommentDraft('')
    setTab('comments')
  }, [commentDraft, draft, extras, patchExtras])

  const toggleSubtask = useCallback(
    (subtaskId: string) => {
      if (!extras) return
      patchExtras({
        subtasks: extras.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, done: !s.done } : s,
        ),
      })
    },
    [extras, patchExtras],
  )

  const addSubtask = useCallback(() => {
    if (!draft || !extras || !newSubtask.trim()) return
    patchExtras({
      subtasks: [
        ...extras.subtasks,
        { id: `${draft.id}-s-${Date.now()}`, title: newSubtask.trim(), done: false },
      ],
    })
    setNewSubtask('')
  }, [draft, extras, newSubtask, patchExtras])

  if (!open || !draft || !extras) return null

  if (detailLoading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
        <p className="rounded-lg bg-devflow-card px-4 py-3 text-body text-devflow-text">
          Loading issue…
        </p>
      </div>
    )
  }

  const project = getProjectById(draft.projectId)
  const sprint =
    draft.sprintId && draft.projectId
      ? getSprintById(draft.projectId, draft.sprintId)
      : undefined
  const statusForBadge = workflowToTaskStatus(draft.workflowStatus ?? draft.status)
  const completedSubtasks = extras.subtasks.filter((s) => s.done).length
  const subtaskProgress =
    extras.subtasks.length > 0
      ? Math.round((completedSubtasks / extras.subtasks.length) * 100)
      : 0

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity dark:bg-black/50"
        aria-label="Close issue details"
        onClick={requestClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="drawer-panel-enter relative flex h-full w-full min-w-0 flex-col border-l border-devflow-border bg-devflow-card shadow-devflow-drawer sm:w-[90vw] md:w-[68vw] lg:w-[62vw] lg:max-w-[48rem]"
      >
        <header className="sticky top-0 z-20 shrink-0 border-b border-devflow-border bg-devflow-card/95 backdrop-blur-sm">
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-start justify-between gap-4">
              <span className="font-mono text-caption font-medium tracking-wide text-devflow-text-muted">
                {draft.key}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  title="Fullscreen (coming soon)"
                  className="rounded-lg p-1.5 text-devflow-text-muted transition-colors hover:bg-devflow-surface"
                  aria-label="Expand to fullscreen"
                  disabled
                >
                  <Maximize2 className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={requestClose}
                  className="rounded-lg p-1.5 text-devflow-text-secondary transition-colors hover:bg-devflow-surface"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <input
              id={titleId}
              value={draft.title}
              onChange={(e) => patchDraft({ title: e.target.value })}
              className="mt-2 w-full bg-transparent text-page-title font-semibold leading-snug text-devflow-text outline-none placeholder:text-devflow-text-muted/50 focus:rounded-md focus:ring-2 focus:ring-devflow-primary/25"
              placeholder="Issue title"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <IssueStatusBadge status={statusForBadge} />
              <PriorityBadge priority={priorityForBadge(draft)} />
              {(draft.labels ?? [draft.label]).slice(0, 4).map((label) => (
                <LabelBadge key={label} label={label.toUpperCase()} />
              ))}
            </div>
          </div>

          <nav
            className="flex gap-0.5 overflow-x-auto border-t border-devflow-border/80 px-3"
            aria-label="Issue sections"
          >
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'shrink-0 border-b-2 px-3 py-2.5 text-btn transition-colors',
                  tab === item.id
                    ? 'border-devflow-primary text-devflow-primary'
                    : 'border-transparent text-devflow-text-secondary hover:border-devflow-border hover:text-devflow-text',
                )}
              >
                {item.label}
                {item.id === 'comments' && extras.comments.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-devflow-pill px-1.5 text-caption">
                    {extras.comments.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-5">
            {tab === 'details' && (
              <div className="space-y-5">
                <div className="rounded-xl border border-devflow-border bg-devflow-surface/80 p-4 lg:hidden">
                  <p className="mb-3 text-caption-label font-semibold uppercase tracking-wider text-devflow-text-muted">
                    Properties
                  </p>
                  <MetadataPanel
                    draft={draft}
                    extras={extras}
                    projectName={project?.name}
                    sprintName={sprint?.name}
                    readOnlyStatus={persisted}
                    onPatch={patchDraft}
                  />
                </div>

                <div>
                  <label className="text-caption-label uppercase text-devflow-text-muted">
                    Description
                  </label>
                  <textarea
                    value={extras.description}
                    onChange={(e) => patchExtras({ description: e.target.value })}
                    rows={5}
                    className="mt-1.5 w-full resize-y rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2 text-input text-devflow-text outline-none focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20"
                  />
                </div>
                <div>
                  <label className="text-caption-label uppercase text-devflow-text-muted">
                    Acceptance Criteria
                  </label>
                  <textarea
                    value={extras.acceptanceCriteria}
                    onChange={(e) =>
                      patchExtras({ acceptanceCriteria: e.target.value })
                    }
                    rows={4}
                    className="mt-1.5 w-full resize-y rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2 text-input text-devflow-text outline-none focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20"
                  />
                </div>
                <div className="rounded-lg border border-devflow-border bg-devflow-surface p-4">
                  <h3 className="flex items-center gap-2 text-card-title text-devflow-text">
                    <MessageSquare className="size-4" />
                    Comments summary
                  </h3>
                  <p className="mt-2 text-body text-devflow-text-secondary">
                    {extras.comments.length === 0
                      ? 'No comments yet.'
                      : `${extras.comments.length} comment${extras.comments.length === 1 ? '' : 's'} — latest from ${extras.comments[extras.comments.length - 1].author.name}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('comments')}
                    className="mt-2 text-btn text-devflow-primary hover:underline"
                  >
                    View all comments
                  </button>
                </div>
              </div>
            )}

            {tab === 'activity' && (
              <ul className="space-y-4">
                {extras.activity.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <Avatar
                      name={item.actor.name}
                      color={item.actor.color}
                      size={32}
                    />
                    <div>
                      <p className="text-body text-devflow-text">
                        <span className="font-semibold">{item.actor.name}</span>{' '}
                        {item.message}
                      </p>
                      <p className="text-caption text-devflow-text-muted">
                        {item.timestamp}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {tab === 'comments' && (
              <div className="space-y-4">
                <ul className="space-y-4">
                  {extras.comments.map((comment) => (
                    <li key={comment.id} className="flex gap-3">
                      <Avatar
                        name={comment.author.name}
                        color={comment.author.color}
                        size={32}
                      />
                      <div className="min-w-0 flex-1 rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-body font-semibold text-devflow-text">
                            {comment.author.name}
                          </span>
                          <span className="text-caption text-devflow-text-muted">
                            {comment.timestamp}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-body text-devflow-text-secondary">
                          {comment.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="rounded-lg border border-devflow-border bg-devflow-surface p-4">
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="Add a comment…"
                    rows={3}
                    className="w-full resize-none bg-transparent text-input outline-none"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={addComment}
                      disabled={!commentDraft.trim()}
                      className="rounded-lg bg-devflow-primary px-4 py-1.5 text-btn text-white disabled:opacity-50"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'attachments' && (
              <div className="space-y-4">
                <AttachmentDropzone
                  attachments={draft.attachments ?? []}
                  onChange={(files) => patchDraft({ attachments: files })}
                />
              </div>
            )}

            {tab === 'subtasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-card-title">
                    <ListChecks className="size-5" />
                    Subtasks
                  </h3>
                  <span className="text-body text-devflow-text-secondary">
                    {completedSubtasks}/{extras.subtasks.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-devflow-table-header">
                  <div
                    className="h-full bg-devflow-primary transition-all"
                    style={{ width: `${subtaskProgress}%` }}
                  />
                </div>
                <ul className="space-y-2">
                  {extras.subtasks.map((subtask) => (
                    <li
                      key={subtask.id}
                      className="flex items-center gap-3 rounded-lg border border-devflow-border px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={subtask.done}
                        onChange={() => toggleSubtask(subtask.id)}
                        className="size-4 rounded border-devflow-border"
                      />
                      <span
                        className={cn(
                          'flex-1 text-body',
                          subtask.done
                            ? 'text-devflow-text-muted line-through'
                            : 'text-devflow-text',
                        )}
                      >
                        {subtask.title}
                      </span>
                      {subtask.done && (
                        <Check className="size-4 text-devflow-success" />
                      )}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add subtask…"
                    className="flex-1 rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2 text-input outline-none focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSubtask()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="inline-flex items-center gap-1 rounded-lg border border-devflow-border px-3 py-2 text-btn hover:bg-devflow-surface"
                  >
                    <Plus className="size-4" />
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {tab === 'details' && (
            <aside
              className={cn(
                'hidden shrink-0 overflow-y-auto border-l-2 border-devflow-border bg-devflow-surface/90 lg:block lg:w-[17.5rem] xl:w-72',
                'shadow-[-6px_0_16px_-8px_rgba(15,23,42,0.12)] dark:shadow-[-6px_0_16px_-8px_rgba(0,0,0,0.35)]',
              )}
            >
              <div className="sticky top-0 p-4">
                <p className="mb-4 text-caption-label font-semibold uppercase tracking-wider text-devflow-text-muted">
                  Properties
                </p>
                <MetadataPanel
                  draft={draft}
                  extras={extras}
                  projectName={project?.name}
                  sprintName={sprint?.name}
                  readOnlyStatus={persisted}
                  onPatch={patchDraft}
                />
              </div>
            </aside>
          )}
        </div>

        <footer className="sticky bottom-0 z-20 flex shrink-0 items-center justify-between gap-3 border-t border-devflow-border bg-devflow-card px-5 py-3 shadow-[0_-4px_12px_-4px_rgba(15,23,42,0.08)]">
          <button
            type="button"
            onClick={handleDelete}
            className="text-btn text-devflow-error transition-colors hover:text-devflow-error/80"
          >
            Delete
          </button>
          <div className="flex items-center gap-2">
            {saveError && (
              <span className="hidden text-caption text-devflow-error sm:inline">
                {saveError}
              </span>
            )}
            {dirty && (
              <span className="hidden text-caption text-devflow-text-muted sm:inline">
                Unsaved changes
              </span>
            )}
            <button
              type="button"
              onClick={requestClose}
              className="rounded-lg border border-devflow-border px-4 py-2 text-btn text-devflow-text-secondary transition-colors hover:bg-devflow-surface"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveChanges()}
              disabled={!dirty || saving}
              className="rounded-lg bg-devflow-primary px-4 py-2 text-btn font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}

type MetadataPanelProps = {
  draft: ProjectIssue
  extras: IssueDetailExtras
  projectName?: string
  sprintName?: string
  readOnlyStatus?: boolean
  onPatch: (patch: Partial<ProjectIssue>) => void
}

function MetadataPanel({
  draft,
  extras,
  projectName,
  sprintName,
  readOnlyStatus = false,
  onPatch,
}: MetadataPanelProps) {
  const assigneeId = memberIdFromAssignee(draft)
  const priorityLevel =
    draft.priorityLevel ??
    (draft.priority === 'high'
      ? 'high'
      : draft.priority === 'low'
        ? 'low'
        : 'medium')

  return (
    <div className="space-y-3">
      <MetaField label="Assignee">
        <AssigneeSelect
          projectId={draft.projectId}
          value={assigneeId}
          onChange={(id) => {
            const member = mockMembers.find((m) => m.id === id)
            onPatch({
              assigneeId: id || null,
              assignee: member
                ? { name: member.name, color: member.color }
                : { name: 'Unassigned', color: '#94a3b8' },
            })
          }}
        />
      </MetaField>

      <MetaField label="Reporter">
        <div className="flex items-center gap-2.5 rounded-lg border border-devflow-border bg-devflow-card px-3 py-2.5">
          <Avatar
            name={extras.reporter.name}
            color={extras.reporter.color}
            size={24}
          />
          <span className="text-input text-devflow-text">{extras.reporter.name}</span>
        </div>
      </MetaField>

      <MetaField label="Priority">
        <IssuePrioritySelect
          value={priorityLevel as IssuePriorityLevel}
          onChange={(value) =>
            onPatch({
              priorityLevel: value,
              priority:
                value === 'high' || value === 'critical' || value === 'blocker'
                  ? 'high'
                  : value === 'low' || value === 'lowest'
                    ? 'low'
                    : 'medium',
            })
          }
        />
      </MetaField>

      <MetaField label="Status">
        <SelectField
          label="Status"
          value={draft.workflowStatus ?? 'todo'}
          disabled={readOnlyStatus}
          onChange={(e) => {
            if (readOnlyStatus) return
            const status = e.target.value as IssueWorkflowStatus
            const boardStatus =
              status === 'done'
                ? 'done'
                : status === 'in_progress' ||
                    status === 'review' ||
                    status === 'testing'
                  ? 'in_progress'
                  : 'todo'
            onPatch({ workflowStatus: status, status: boardStatus })
          }}
          options={ISSUE_STATUS_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
        />
      </MetaField>

      <MetaField label="Sprint">
        <div className="flex items-center gap-2 rounded-lg border border-devflow-border bg-devflow-card px-3 py-2.5 text-input text-devflow-text">
          <ChevronDown className="size-4 shrink-0 text-devflow-text-muted" />
          <span className="truncate">{sprintName ?? 'Backlog'}</span>
        </div>
      </MetaField>

      <MetaField label="Due Date">
        <div className="flex items-center gap-2 rounded-lg border border-devflow-border bg-devflow-card px-3 py-2.5">
          <Calendar className="size-4 shrink-0 text-devflow-text-muted" />
          <input
            type="text"
            value={draft.dueDate ?? ''}
            onChange={(e) => onPatch({ dueDate: e.target.value })}
            placeholder="Set due date"
            className="min-w-0 flex-1 bg-transparent text-input outline-none"
          />
        </div>
      </MetaField>

      <MetaField label="Labels">
        <LabelMultiSelect
          projectId={draft.projectId}
          selected={draft.labelIds ?? []}
          onChange={(labelIds) =>
            onPatch({
              labelIds,
            })
          }
        />
      </MetaField>

      <div className="border-t border-devflow-border/80 pt-3">
        <MetaField label="Epic">
          <input
            value={extras.epic ?? ''}
            readOnly
            className="w-full rounded-lg border border-devflow-border bg-devflow-card px-3 py-2.5 text-input text-devflow-text-secondary"
          />
        </MetaField>

        <MetaField label="Story Points">
          <select
            value={String(draft.storyPoints ?? '')}
            onChange={(e) =>
              onPatch({
                storyPoints: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-devflow-border bg-devflow-card px-3 py-2.5 text-input"
          >
            <option value="">—</option>
            {STORY_POINT_OPTIONS.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </MetaField>

        <MetaField label="Project">
          <span className="block rounded-lg border border-transparent px-1 py-0.5 text-input text-devflow-text-secondary">
            {projectName ?? '—'}
          </span>
        </MetaField>

        <MetaField label="Created By">
          <span className="block text-input text-devflow-text-secondary">
            {extras.createdBy}
          </span>
        </MetaField>

        <MetaField label="Created At">
          <span className="block text-caption text-devflow-text-muted">
            {extras.createdAt}
          </span>
        </MetaField>

        <MetaField label="Updated At">
          <span className="block text-caption text-devflow-text-muted">
            {extras.updatedAt}
          </span>
        </MetaField>
      </div>
    </div>
  )
}

function MetaField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-devflow-border/50 bg-devflow-card/60 p-3">
      <p className="mb-2 text-caption-label font-medium uppercase tracking-wider text-devflow-text-muted">
        {label}
      </p>
      <div className="[&_label]:sr-only [&_.text-label]:sr-only">
        {children}
      </div>
    </div>
  )
}
