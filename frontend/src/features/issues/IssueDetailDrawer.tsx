import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import {
  Calendar,
  Check,
  ChevronDown,
  ListChecks,
  Maximize2,
  MessageSquare,
  Paperclip,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { AssigneeSelect } from '@/components/issues/AssigneeSelect'
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
import {
  createComment as apiCreateComment,
  deleteComment as apiDeleteComment,
  deleteIssueAttachment as apiDeleteIssueAttachment,
  getIssueActivity as apiGetIssueActivity,
  getIssueAttachments as apiGetIssueAttachments,
  getIssue as apiGetIssue,
  getIssueComments as apiGetIssueComments,
  type IssueActivityApi,
  type IssueAttachmentApi,
  transitionIssue as apiTransitionIssue,
  updateComment as apiUpdateComment,
  uploadIssueAttachment as apiUploadIssueAttachment,
} from '@/api/issues'
import {
  ensureProjectMembersLoaded,
  getProjectMembersSnapshot,
} from '@/services/projectMembersStore'
import { ApiError } from '@/api/types'
import { getWorkflow, type WorkflowStatusApi } from '@/api/workflow'
import { useAuth } from '@/features/auth/AuthProvider'
import { refreshKanbanBoard } from '@/features/kanban/kanbanRefreshBridge'
import { useIssues } from '@/contexts/IssuesContext'
import {
  getIssueDetailExtras,
  updateIssueDetailExtras,
} from '@/services/issueDetailStore'
import {
  getIssueById,
  updateIssueInRegistry,
  upsertApiIssue,
} from '@/services/issuesRegistry'
import { isApiIssueId, mapIssueDetailToUi } from '@/services/mapIssueApi'
import { getProjectById, getSprintById } from '@/services/projectData'
import { mockMembers } from '@/services/mockMembers'
import type { IssueDetailExtras, IssueComment } from '@/types/issueDetail'
import {
  mapWorkflowToBoardStatus,
  type IssuePriorityLevel,
  type IssueWorkflowStatus,
  type ProjectIssue,
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

const COMMENT_AVATAR_COLORS = [
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#0ea5e9',
  '#8b5cf6',
]

function avatarColorForUserId(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return COMMENT_AVATAR_COLORS[hash % COMMENT_AVATAR_COLORS.length]
}

function formatCommentCreatedAt(createdAt: string): string {
  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) return createdAt
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatActivityCreatedAt(createdAt: string): string {
  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) return createdAt
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatAttachmentCreatedAt(createdAt: string): string {
  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) return createdAt
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function attachmentFilename(fileUrl: string): string {
  const withoutQuery = fileUrl.split('?')[0]
  const segments = withoutQuery.split('/')
  const lastSegment = segments.at(-1)
  if (!lastSegment) return fileUrl
  try {
    return decodeURIComponent(lastSegment)
  } catch {
    return lastSegment
  }
}

const ACTIVITY_MESSAGE_BY_EVENT_TYPE: Record<string, string> = {
  status_changed: 'changed status',
  sprint_changed: 'changed sprint',
  assignee_changed: 'changed assignee',
  assignee_updated: 'changed assignee',
  comment_added: 'added a comment',
  comment_deleted: 'deleted a comment',
  attachment_added: 'added an attachment',
  attachment_deleted: 'removed an attachment',
}

const TRANSITION_EVENT_TYPES = new Set([
  'status_changed',
  'sprint_changed',
  'assignee_changed',
  'assignee_updated',
])

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

function humanizeEnumLabel(value: string): string {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

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
  const { user } = useAuth()
  const titleId = useId()
  const [tab, setTab] = useState<DetailTab>('details')
  const [extras, setExtras] = useState<IssueDetailExtras | null>(null)
  const [draft, setDraft] = useState<ProjectIssue | null>(null)
  const [dirty, setDirty] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentBody, setEditingCommentBody] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsSaving, setCommentsSaving] = useState(false)
  const [commentBusyId, setCommentBusyId] = useState<string | null>(null)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [activity, setActivity] = useState<IssueActivityApi[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<IssueAttachmentApi[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [attachmentsSaving, setAttachmentsSaving] = useState(false)
  const [attachmentBusyId, setAttachmentBusyId] = useState<string | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [memberNamesById, setMemberNamesById] = useState<Record<string, string>>({})
  const [newSubtask, setNewSubtask] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatusApi[]>([])
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [transitioningStatus, setTransitioningStatus] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
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
    setEditingCommentId(null)
    setEditingCommentBody('')
    setCommentError(null)
    setActivity([])
    setActivityError(null)
    setAttachments([])
    setAttachmentError(null)
    setAttachmentBusyId(null)
    setAttachmentsSaving(false)
    setMemberNamesById({})
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

  useEffect(() => {
    if (!open || !issue?.projectId) {
      setWorkflowStatuses([])
      return
    }

    let active = true
    setWorkflowLoading(true)

    void getWorkflow(issue.projectId)
      .then((workflow) => {
        if (!active) return
        setWorkflowStatuses(
          [...workflow.statuses].sort((a, b) => a.order - b.order),
        )
      })
      .catch((error: unknown) => {
        if (!active) return
        const message =
          error instanceof ApiError ? error.message : 'Failed to load workflow statuses.'
        setSaveError(message)
        setWorkflowStatuses([])
      })
      .finally(() => {
        if (active) setWorkflowLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, issue?.projectId])

  const loadIssueComments = useCallback(
    async (issueId: string, projectId: string) => {
      setCommentsLoading(true)
      setCommentError(null)
      try {
        await ensureProjectMembersLoaded(projectId)
        const { members } = getProjectMembersSnapshot(projectId)
        const comments = await apiGetIssueComments(issueId)

        const nextMemberNamesById = members.reduce<Record<string, string>>((acc, member) => {
          acc[member.user_id] = member.display_name || member.email || member.user_id
          return acc
        }, {})
        setMemberNamesById(nextMemberNamesById)
        const mappedComments = [...comments]
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          )
          .map((comment) => {
            const isCurrentUser = user?.id === comment.author
            const currentUserName = user?.display_name || user?.email || 'You'
            const authorName =
              nextMemberNamesById[comment.author] ??
              (isCurrentUser ? currentUserName : `User ${comment.author.slice(0, 8)}`)
            return {
              id: comment.id,
              authorId: comment.author,
              author: {
                name: authorName,
                color: avatarColorForUserId(comment.author),
              },
              body: comment.body,
              createdAt: comment.created_at,
              timestamp: formatCommentCreatedAt(comment.created_at),
            }
          })

        setExtras((prev) => (prev ? { ...prev, comments: mappedComments } : prev))
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Failed to load comments.'
        setCommentError(message)
      } finally {
        setCommentsLoading(false)
      }
    },
    [user?.display_name, user?.email, user?.id],
  )

  const loadIssueActivity = useCallback(async (issueId: string) => {
    setActivityLoading(true)
    setActivityError(null)
    try {
      const entries = await apiGetIssueActivity(issueId)
      // Keep backend ordering (newest first).
      setActivity(entries)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to load activity.'
      setActivityError(message)
      setActivity([])
    } finally {
      setActivityLoading(false)
    }
  }, [])

  const loadIssueAttachments = useCallback(async (issueId: string) => {
    setAttachmentsLoading(true)
    setAttachmentError(null)
    try {
      const entries = await apiGetIssueAttachments(issueId)
      const ordered = [...entries].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      setAttachments(ordered)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to load attachments.'
      setAttachmentError(message)
      setAttachments([])
    } finally {
      setAttachmentsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !persisted || !draft?.id || !draft.projectId) return
    void loadIssueComments(draft.id, draft.projectId)
  }, [draft?.id, draft?.projectId, loadIssueComments, open, persisted])

  useEffect(() => {
    if (!open || !persisted || !draft?.id) return
    void loadIssueActivity(draft.id)
  }, [draft?.id, loadIssueActivity, open, persisted])

  useEffect(() => {
    if (!open || !persisted || !draft?.id) return
    void loadIssueAttachments(draft.id)
  }, [draft?.id, loadIssueAttachments, open, persisted])

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
        await loadIssueActivity(updated.id)
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
    loadIssueActivity,
  ])

  const patchDraft = useCallback((patch: Partial<ProjectIssue>) => {
    setDraft((prev) => {
      if (!prev) return prev
      setDirty(true)
      return { ...prev, ...patch }
    })
  }, [])

  const handleStatusChange = useCallback(
    async (selectedStatus: string) => {
      if (!draft) return

      if (!persisted) {
        const status = selectedStatus as IssueWorkflowStatus
        patchDraft({
          workflowStatus: status,
          status: mapWorkflowToBoardStatus(status),
        })
        return
      }

      const targetStatus = workflowStatuses.find(
        (status) => status.id === selectedStatus,
      )
      if (!targetStatus || targetStatus.slug === draft.workflowStatus) return

      setTransitioningStatus(true)
      setSaveError(null)

      try {
        await apiTransitionIssue(draft.id, targetStatus.id)
        const refreshedDetail = await apiGetIssue(draft.id)
        const refreshed = mapIssueDetailToUi(refreshedDetail, draft.projectId)
        const nextDraft = dirty
          ? {
              ...draft,
              workflowStatus: refreshed.workflowStatus,
              status: refreshed.status,
              done: refreshed.done,
            }
          : refreshed

        upsertApiIssue(refreshed)
        loadedWorkflowStatusRef.current = refreshed.workflowStatus
        setDraft(nextDraft)
        onIssueUpdated(refreshed)
        await loadBacklog(draft.projectId)
        if (draft.sprintId) {
          await loadSprintIssues(draft.projectId, draft.sprintId)
        }
        refreshKanbanBoard()
        await loadIssueActivity(draft.id)

        if (!dirty) {
          setDirty(false)
          initialSnapshotRef.current = JSON.stringify({ issue: refreshed })
        }
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Failed to transition issue.'
        setSaveError(message)
      } finally {
        setTransitioningStatus(false)
      }
    },
    [
      dirty,
      draft,
      loadBacklog,
      loadSprintIssues,
      onIssueUpdated,
      patchDraft,
      persisted,
      workflowStatuses,
      loadIssueActivity,
    ],
  )

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

  const addComment = useCallback(async () => {
    if (!draft || !extras || !commentDraft.trim()) return

    if (!persisted) {
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
      return
    }

    setCommentsSaving(true)
    setCommentError(null)
    try {
      await apiCreateComment(draft.id, commentDraft.trim())
      setCommentDraft('')
      await loadIssueComments(draft.id, draft.projectId)
      await loadIssueActivity(draft.id)
      setTab('comments')
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to create comment.'
      setCommentError(message)
    } finally {
      setCommentsSaving(false)
    }
  }, [
    commentDraft,
    draft,
    extras,
    loadIssueActivity,
    loadIssueComments,
    patchExtras,
    persisted,
  ])

  const canManageComment = useCallback(
    (comment: IssueComment) => {
      if (comment.authorId && user?.id) return comment.authorId === user.id
      if (!user?.display_name) return false
      return comment.author.name === user.display_name
    },
    [user?.display_name, user?.id],
  )

  const startEditingComment = useCallback((comment: IssueComment) => {
    setEditingCommentId(comment.id)
    setEditingCommentBody(comment.body)
    setCommentError(null)
  }, [])

  const cancelEditingComment = useCallback(() => {
    setEditingCommentId(null)
    setEditingCommentBody('')
  }, [])

  const saveEditedComment = useCallback(async () => {
    if (!persisted || !draft || !editingCommentId || !editingCommentBody.trim()) return
    setCommentBusyId(editingCommentId)
    setCommentError(null)
    try {
      await apiUpdateComment(editingCommentId, editingCommentBody.trim())
      setEditingCommentId(null)
      setEditingCommentBody('')
      await loadIssueComments(draft.id, draft.projectId)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to update comment.'
      setCommentError(message)
    } finally {
      setCommentBusyId(null)
    }
  }, [draft, editingCommentBody, editingCommentId, loadIssueComments, persisted])

  const removeComment = useCallback(
    async (comment: IssueComment) => {
      if (!persisted || !draft) return
      if (!window.confirm('Delete this comment?')) return
      setCommentBusyId(comment.id)
      setCommentError(null)
      try {
        await apiDeleteComment(comment.id)
        if (editingCommentId === comment.id) {
          setEditingCommentId(null)
          setEditingCommentBody('')
        }
        await loadIssueComments(draft.id, draft.projectId)
        await loadIssueActivity(draft.id)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Failed to delete comment.'
        setCommentError(message)
      } finally {
        setCommentBusyId(null)
      }
    },
    [draft, editingCommentId, loadIssueActivity, loadIssueComments, persisted],
  )

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

  const statusLabelByKey = useMemo(() => {
    const labels: Record<string, string> = {}

    ISSUE_STATUS_OPTIONS.forEach((option) => {
      labels[option.value] = option.label
      labels[option.label.toLowerCase()] = option.label
    })

    workflowStatuses.forEach((status) => {
      labels[status.id] = status.name
      labels[status.slug] = status.name
      labels[status.name.toLowerCase()] = status.name
    })

    return labels
  }, [workflowStatuses])

  const currentUserName = user?.display_name || user?.email || 'Unknown User'
  const canEditIssue = Boolean(user)

  const resolveUploaderName = useCallback(
    (uploadedBy: string): string => {
      if (memberNamesById[uploadedBy]) return memberNamesById[uploadedBy]
      if (user?.id && uploadedBy === user.id) return currentUserName
      return uploadedBy
    },
    [currentUserName, memberNamesById, user?.id],
  )

  const resolveActorName = useCallback(
    (value: string | null | undefined): string => {
      if (!value) return 'Unknown User'
      const normalized = value.trim()
      if (!normalized) return 'Unknown User'

      if (memberNamesById[normalized]) return memberNamesById[normalized]
      if (user?.id && normalized === user.id) return currentUserName
      if (looksLikeUuid(normalized)) return 'Unknown User'
      return normalized
    },
    [currentUserName, memberNamesById, user?.id],
  )

  const formatTransitionValue = useCallback(
    (eventType: string, value: string | null): string => {
      if (eventType === 'assignee_changed' || eventType === 'assignee_updated') {
        if (!value) return 'Unassigned'
        return resolveActorName(value)
      }

      if (eventType === 'sprint_changed') {
        if (!value) return 'Backlog'
        if (draft?.projectId) {
          const sprintById = getSprintById(draft.projectId, value)
          if (sprintById?.name) return sprintById.name
        }
        if (looksLikeUuid(value)) return 'Unknown Sprint'
        return value
      }

      if (eventType === 'status_changed') {
        if (!value) return 'Unknown Status'
        const knownLabel = statusLabelByKey[value] ?? statusLabelByKey[value.toLowerCase()]
        if (knownLabel) return knownLabel
        if (looksLikeUuid(value)) return 'Unknown Status'
        return humanizeEnumLabel(value)
      }

      if (!value) return 'Unknown'
      if (looksLikeUuid(value)) return 'Unknown'
      return value
    },
    [draft?.projectId, resolveActorName, statusLabelByKey],
  )

  const formattedActivity = useMemo(
    () =>
      activity.map((item) => {
        const actorName = resolveActorName(item.actor)
        const action = ACTIVITY_MESSAGE_BY_EVENT_TYPE[item.event_type] ?? 'updated issue'
        const transition = TRANSITION_EVENT_TYPES.has(item.event_type)
          ? `${formatTransitionValue(item.event_type, item.old_value)} \u2192 ${formatTransitionValue(item.event_type, item.new_value)}`
          : null

        return {
          id: item.id,
          message: `${actorName} ${action}`,
          transition,
          timestamp: formatActivityCreatedAt(item.created_at),
        }
      }),
    [activity, formatTransitionValue, resolveActorName],
  )

  const handleAttachmentSelection = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file || !persisted || !draft?.id) return

      setAttachmentsSaving(true)
      setAttachmentError(null)
      try {
        await apiUploadIssueAttachment(draft.id, file)
        await loadIssueAttachments(draft.id)
        await loadIssueActivity(draft.id)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Failed to upload attachment.'
        setAttachmentError(message)
      } finally {
        setAttachmentsSaving(false)
      }
    },
    [draft?.id, loadIssueActivity, loadIssueAttachments, persisted],
  )

  const removeAttachment = useCallback(
    async (attachment: IssueAttachmentApi) => {
      if (!persisted || !draft?.id || !canEditIssue) return
      if (!window.confirm(`Delete "${attachmentFilename(attachment.file)}"?`)) return
      setAttachmentBusyId(attachment.id)
      setAttachmentError(null)
      try {
        await apiDeleteIssueAttachment(attachment.id)
        await loadIssueAttachments(draft.id)
        await loadIssueActivity(draft.id)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Failed to delete attachment.'
        setAttachmentError(message)
      } finally {
        setAttachmentBusyId(null)
      }
    },
    [canEditIssue, draft?.id, loadIssueActivity, loadIssueAttachments, persisted],
  )

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
                    persistedStatus={persisted}
                    workflowStatuses={workflowStatuses}
                    statusLoading={workflowLoading}
                    statusTransitioning={transitioningStatus}
                    onStatusChange={handleStatusChange}
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
              <div className="space-y-4">
                {persisted ? (
                  <>
                    {activityError && (
                      <p className="text-caption text-devflow-error">{activityError}</p>
                    )}
                    {activityLoading && (
                      <p className="text-body text-devflow-text-secondary">
                        Loading activity…
                      </p>
                    )}
                    {!activityLoading && activity.length === 0 && !activityError && (
                      <p className="text-body text-devflow-text-secondary">
                        No activity yet.
                      </p>
                    )}
                    <ul className="space-y-3">
                      {formattedActivity.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2.5"
                        >
                          <p className="text-body text-devflow-text">{item.message}</p>
                          {item.transition && (
                            <p className="text-body text-devflow-text-secondary">
                              {item.transition}
                            </p>
                          )}
                          <p className="text-caption text-devflow-text-muted">
                            {item.timestamp}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
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
              </div>
            )}

            {tab === 'comments' && (
              <div className="space-y-4">
                {commentError && (
                  <p className="text-caption text-devflow-error">{commentError}</p>
                )}
                {commentsLoading && (
                  <p className="text-body text-devflow-text-secondary">Loading comments…</p>
                )}
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
                          <div className="min-w-0">
                            <span className="text-body font-semibold text-devflow-text">
                              {comment.author.name}
                            </span>
                            <span className="ml-2 text-caption text-devflow-text-muted">
                              {comment.timestamp}
                            </span>
                          </div>
                          {canManageComment(comment) && (
                            <div className="shrink-0 space-x-2 text-caption">
                              {editingCommentId !== comment.id && (
                                <button
                                  type="button"
                                  onClick={() => startEditingComment(comment)}
                                  className="text-devflow-primary hover:underline"
                                  disabled={commentBusyId === comment.id}
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => void removeComment(comment)}
                                className="text-devflow-error hover:underline disabled:opacity-50"
                                disabled={commentBusyId === comment.id}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="mt-2">
                            <textarea
                              value={editingCommentBody}
                              onChange={(e) => setEditingCommentBody(e.target.value)}
                              rows={3}
                              className="w-full resize-y rounded-lg border border-devflow-border bg-devflow-card px-3 py-2 text-input outline-none focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20"
                            />
                            <div className="mt-2 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={cancelEditingComment}
                                className="rounded-lg border border-devflow-border px-3 py-1.5 text-btn text-devflow-text-secondary hover:bg-devflow-card"
                                disabled={commentBusyId === comment.id}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => void saveEditedComment()}
                                className="rounded-lg bg-devflow-primary px-3 py-1.5 text-btn text-white disabled:opacity-50"
                                disabled={
                                  !editingCommentBody.trim() || commentBusyId === comment.id
                                }
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 whitespace-pre-wrap text-body text-devflow-text-secondary">
                            {comment.body}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {!commentsLoading && extras.comments.length === 0 && (
                  <p className="text-body text-devflow-text-secondary">
                    No comments yet.
                  </p>
                )}
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
                      onClick={() => void addComment()}
                      disabled={!commentDraft.trim() || commentsSaving}
                      className="rounded-lg bg-devflow-primary px-4 py-1.5 text-btn text-white disabled:opacity-50"
                    >
                      {commentsSaving ? 'Commenting…' : 'Comment'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'attachments' && (
              <div className="space-y-4">
                {persisted ? (
                  <>
                    {attachmentError && (
                      <p className="text-caption text-devflow-error">{attachmentError}</p>
                    )}
                    <div className="flex items-center justify-between rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2.5">
                      <p className="flex items-center gap-2 text-body text-devflow-text-secondary">
                        <Paperclip className="size-4" />
                        Attach files to this issue
                      </p>
                      <button
                        type="button"
                        onClick={() => attachmentInputRef.current?.click()}
                        disabled={attachmentsSaving}
                        className="inline-flex items-center gap-1 rounded-lg bg-devflow-primary px-3 py-1.5 text-btn text-white disabled:opacity-50"
                      >
                        <Upload className="size-4" />
                        {attachmentsSaving ? 'Uploading…' : 'Upload file'}
                      </button>
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        className="hidden"
                        onChange={(event) => void handleAttachmentSelection(event)}
                      />
                    </div>
                    {attachmentsLoading ? (
                      <p className="text-body text-devflow-text-secondary">
                        Loading attachments…
                      </p>
                    ) : attachments.length === 0 ? (
                      <p className="text-body text-devflow-text-secondary">
                        No attachments yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {attachments.map((attachment) => (
                          <li
                            key={attachment.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-body font-medium text-devflow-text">
                                {attachmentFilename(attachment.file)}
                              </p>
                              <p className="text-caption text-devflow-text-muted">
                                Uploaded by {resolveUploaderName(attachment.uploaded_by)} •{' '}
                                {formatAttachmentCreatedAt(attachment.created_at)}
                              </p>
                            </div>
                            {canEditIssue && (
                              <button
                                type="button"
                                onClick={() => void removeAttachment(attachment)}
                                disabled={attachmentBusyId === attachment.id}
                                className="rounded p-1 text-devflow-text-muted transition-colors hover:bg-devflow-card hover:text-devflow-error disabled:opacity-50"
                                aria-label={`Delete ${attachmentFilename(attachment.file)}`}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className="text-body text-devflow-text-secondary">
                    Save this issue before adding attachments.
                  </p>
                )}
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
                  persistedStatus={persisted}
                  workflowStatuses={workflowStatuses}
                  statusLoading={workflowLoading}
                  statusTransitioning={transitioningStatus}
                  onStatusChange={handleStatusChange}
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
  persistedStatus?: boolean
  workflowStatuses?: WorkflowStatusApi[]
  statusLoading?: boolean
  statusTransitioning?: boolean
  onStatusChange?: (status: string) => void
  onPatch: (patch: Partial<ProjectIssue>) => void
}

function MetadataPanel({
  draft,
  extras,
  projectName,
  sprintName,
  persistedStatus = false,
  workflowStatuses = [],
  statusLoading = false,
  statusTransitioning = false,
  onStatusChange,
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
  const currentWorkflowStatus = draft.workflowStatus ?? 'todo'
  const selectedWorkflowStatus = workflowStatuses.find(
    (status) => status.slug === currentWorkflowStatus,
  )
  const useWorkflowOptions = persistedStatus && workflowStatuses.length > 0
  const currentStatusLabel =
    ISSUE_STATUS_OPTIONS.find((option) => option.value === currentWorkflowStatus)
      ?.label ?? currentWorkflowStatus
  const statusOptions = useWorkflowOptions
    ? [
        ...(selectedWorkflowStatus
          ? []
          : [{ value: currentWorkflowStatus, label: currentStatusLabel }]),
        ...workflowStatuses.map((status) => ({
          value: status.id,
          label: status.name,
        })),
      ]
    : ISSUE_STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      }))
  const statusValue =
    useWorkflowOptions && selectedWorkflowStatus
      ? selectedWorkflowStatus.id
      : currentWorkflowStatus
  const statusDisabled =
    statusTransitioning || (persistedStatus && (statusLoading || !useWorkflowOptions))
  const statusHint = statusTransitioning
    ? 'Updating status…'
    : statusLoading
      ? 'Loading workflow statuses…'
      : undefined

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
          value={statusValue}
          disabled={statusDisabled}
          hint={statusHint}
          onChange={(e) => {
            if (statusDisabled) return
            onStatusChange?.(e.target.value)
          }}
          options={statusOptions}
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
