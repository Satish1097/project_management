import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getBacklogMetadata,
  getBacklogSectionIssues,
  getBacklogSprintSectionIssues,
} from '@/api/issues'
import { ApiError } from '@/api/types'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import {
  BACKLOG_SECTION_ID,
  isBacklogSection,
  parseSprintIdFromSection,
  sprintSectionId,
} from '@/features/backlog/backlogSections'
import {
  mapBacklogSprintMetadataToUi,
  sortSprintsForBacklog,
} from '@/features/backlog/backlogSprintUtils'
import {
  createEmptySectionState,
  mergeItemsById,
  type SectionPaginationState,
} from '@/lib/sectionPagination'
import { upsertApiIssue } from '@/services/issuesRegistry'
import { mapIssueSummaryToUi } from '@/services/mapIssueApi'
import type { ProjectIssue } from '@/types/issues'
import type { Sprint } from '@/types/sprints'

export type BacklogSectionMeta = {
  sectionId: string
  kind: 'backlog' | 'sprint'
  title: string
  issueCount: number
  sprint?: Sprint
}

type UseProjectBacklogOptions = {
  enabled?: boolean
  search?: string
}

type SectionFetchTarget = {
  sectionId: string
  issueCount: number
}

export function useProjectBacklog(
  projectId: string,
  options: UseProjectBacklogOptions = {},
) {
  const { enabled = true, search = '' } = options
  const trimmedSearch = search.trim()

  const [sections, setSections] = useState<BacklogSectionMeta[]>([])
  const [sectionStates, setSectionStates] = useState<
    Record<string, SectionPaginationState<ProjectIssue>>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIdRef = useRef(0)
  const sectionFetchIdsRef = useRef<Record<string, number>>({})
  const loadedPagesRef = useRef<Record<string, number[]>>({})
  const initializedSectionsRef = useRef<Set<string>>(new Set())

  const searchKey = trimmedSearch

  const sectionTargets = useMemo(() => {
    const targets = new Map<string, SectionFetchTarget>()
    for (const section of sections) {
      targets.set(section.sectionId, {
        sectionId: section.sectionId,
        issueCount: section.issueCount,
      })
    }
    return targets
  }, [sections])

  const buildSectionQuery = useCallback(
    (page: number) => ({
      page,
      page_size: DEFAULT_PAGE_SIZE,
      ...(trimmedSearch ? { search: trimmedSearch } : {}),
    }),
    [trimmedSearch],
  )

  const fetchSectionPage = useCallback(
    async (
      sectionId: string,
      page: number,
      append: boolean,
      fetchGeneration: number,
    ) => {
      const sectionFetchId = (sectionFetchIdsRef.current[sectionId] ?? 0) + 1
      sectionFetchIdsRef.current[sectionId] = sectionFetchId

      setSectionStates((prev) => ({
        ...prev,
        [sectionId]: {
          ...(prev[sectionId] ?? createEmptySectionState<ProjectIssue>()),
          loading: true,
        },
      }))

      try {
        const query = buildSectionQuery(page)
        const sprintId = parseSprintIdFromSection(sectionId)
        const response = sprintId
          ? await getBacklogSprintSectionIssues(projectId, sprintId, query)
          : await getBacklogSectionIssues(projectId, query)

        if (fetchGeneration !== fetchIdRef.current) return
        if (sectionFetchId !== sectionFetchIdsRef.current[sectionId]) return

        const issues = response.issues.map((issue) => {
          const mapped = mapIssueSummaryToUi(issue, projectId)
          upsertApiIssue(mapped)
          return mapped
        })

        setSectionStates((prev) => {
          const current = prev[sectionId] ?? createEmptySectionState<ProjectIssue>()
          const mergedIssues = append
            ? mergeItemsById(current.issues, issues)
            : issues

          return {
            ...prev,
            [sectionId]: {
              issues: mergedIssues,
              page: response.page,
              hasNext: response.has_next,
              loading: false,
              total: response.total,
              initialized: true,
            },
          }
        })

        initializedSectionsRef.current.add(sectionId)

        const pages = loadedPagesRef.current[sectionId] ?? []
        if (!pages.includes(page)) {
          loadedPagesRef.current[sectionId] = [...pages, page].sort((a, b) => a - b)
        }
      } catch (err) {
        if (fetchGeneration !== fetchIdRef.current) return
        if (sectionFetchId !== sectionFetchIdsRef.current[sectionId]) return

        const message =
          err instanceof ApiError ? err.message : 'Failed to load section issues.'
        setError(message)
        setSectionStates((prev) => ({
          ...prev,
          [sectionId]: {
            ...(prev[sectionId] ?? createEmptySectionState<ProjectIssue>()),
            loading: false,
          },
        }))
      }
    },
    [buildSectionQuery, projectId],
  )

  const loadBacklogMetadata = useCallback(async () => {
    if (!projectId || !enabled) {
      setLoading(false)
      return
    }

    const fetchGeneration = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      const metadata = await getBacklogMetadata(
        projectId,
        trimmedSearch ? { search: trimmedSearch } : undefined,
      )

      if (fetchGeneration !== fetchIdRef.current) return

      const sprintSections = sortSprintsForBacklog(
        metadata.sprints.map((sprint) => mapBacklogSprintMetadataToUi(sprint, projectId)),
      ).map((sprint) => ({
        sectionId: sprintSectionId(sprint.id),
        kind: 'sprint' as const,
        title: sprint.name,
        issueCount: sprint.issueCount,
        sprint,
      }))

      // Jira-style ordering: active sprints first, then planned sprints,
      // then the Backlog section last.
      const nextSections: BacklogSectionMeta[] = [
        ...sprintSections,
        {
          sectionId: BACKLOG_SECTION_ID,
          kind: 'backlog',
          title: 'Backlog',
          issueCount: metadata.backlog_issue_count,
        },
      ]

      setSections(nextSections)
    } catch (err) {
      if (fetchGeneration !== fetchIdRef.current) return
      const message =
        err instanceof ApiError ? err.message : 'Failed to load backlog.'
      setError(message)
      setSections([])
    } finally {
      if (fetchGeneration === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [enabled, projectId, trimmedSearch])

  const refreshBacklog = useCallback(async () => {
    if (!projectId || !enabled) return

    const fetchGeneration = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    const pagesBySection = { ...loadedPagesRef.current }
    const initializedSections = [...initializedSectionsRef.current]

    try {
      const metadata = await getBacklogMetadata(
        projectId,
        trimmedSearch ? { search: trimmedSearch } : undefined,
      )

      if (fetchGeneration !== fetchIdRef.current) return

      const sprintSections = sortSprintsForBacklog(
        metadata.sprints.map((sprint) => mapBacklogSprintMetadataToUi(sprint, projectId)),
      ).map((sprint) => ({
        sectionId: sprintSectionId(sprint.id),
        kind: 'sprint' as const,
        title: sprint.name,
        issueCount: sprint.issueCount,
        sprint,
      }))

      // Jira-style ordering: active sprints first, then planned sprints,
      // then the Backlog section last.
      const nextSections: BacklogSectionMeta[] = [
        ...sprintSections,
        {
          sectionId: BACKLOG_SECTION_ID,
          kind: 'backlog',
          title: 'Backlog',
          issueCount: metadata.backlog_issue_count,
        },
      ]

      setSections(nextSections)

      const issueCountBySection = new Map(
        nextSections.map((section) => [section.sectionId, section.issueCount]),
      )

      const reloadTasks: Promise<void>[] = []
      for (const sectionId of initializedSections) {
        const issueCount = issueCountBySection.get(sectionId) ?? 0
        const pages = pagesBySection[sectionId]?.length
          ? pagesBySection[sectionId]
          : issueCount > 0
            ? [1]
            : []

        if (pages.length === 0) {
          setSectionStates((prev) => ({
            ...prev,
            [sectionId]: { ...createEmptySectionState<ProjectIssue>(), total: 0, initialized: false },
          }))
          initializedSectionsRef.current.delete(sectionId)
          continue
        }

        setSectionStates((prev) => ({
          ...prev,
          [sectionId]: {
            ...(prev[sectionId] ?? createEmptySectionState<ProjectIssue>()),
            loading: true,
          },
        }))

        reloadTasks.push(
          (async () => {
            for (let index = 0; index < pages.length; index += 1) {
              await fetchSectionPage(
                sectionId,
                pages[index],
                index > 0,
                fetchGeneration,
              )
            }
          })(),
        )
      }

      loadedPagesRef.current = pagesBySection
      await Promise.all(reloadTasks)
    } catch (err) {
      if (fetchGeneration !== fetchIdRef.current) return
      const message =
        err instanceof ApiError ? err.message : 'Failed to refresh backlog.'
      setError(message)
    } finally {
      if (fetchGeneration === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [enabled, fetchSectionPage, projectId, trimmedSearch])

  useEffect(() => {
    fetchIdRef.current += 1
    setSections([])
    setSectionStates({})
    setError(null)
    setLoading(true)
    loadedPagesRef.current = {}
    sectionFetchIdsRef.current = {}
    initializedSectionsRef.current = new Set()
    void loadBacklogMetadata()
  }, [loadBacklogMetadata, searchKey, projectId])

  const initializeSection = useCallback(
    (sectionId: string) => {
      const target = sectionTargets.get(sectionId)
      if (!target) return

      const state = sectionStates[sectionId]
      if (state?.initialized || state?.loading) return

      if (target.issueCount === 0) {
        setSectionStates((prev) => ({
          ...prev,
          [sectionId]: { ...createEmptySectionState<ProjectIssue>(), total: 0, initialized: true },
        }))
        initializedSectionsRef.current.add(sectionId)
        return
      }

      void fetchSectionPage(sectionId, 1, false, fetchIdRef.current)
    },
    [fetchSectionPage, sectionStates, sectionTargets],
  )

  const loadMoreSection = useCallback(
    (sectionId: string) => {
      const state = sectionStates[sectionId] ?? createEmptySectionState<ProjectIssue>()
      if (state.loading || !state.hasNext) return

      void fetchSectionPage(sectionId, state.page + 1, true, fetchIdRef.current)
    },
    [fetchSectionPage, sectionStates],
  )

  const moveIssueBetweenSections = useCallback(
    (
      issueId: string,
      sourceSectionId: string,
      targetSectionId: string,
      issue?: ProjectIssue,
    ) => {
      if (sourceSectionId === targetSectionId) return

      setSectionStates((prev) => {
        const source = prev[sourceSectionId] ?? createEmptySectionState<ProjectIssue>()
        const target = prev[targetSectionId] ?? createEmptySectionState<ProjectIssue>()
        const movedIssue =
          issue ?? source.issues.find((item) => item.id === issueId)

        if (!movedIssue) return prev

        const targetSprintId = parseSprintIdFromSection(targetSectionId)
        const nextIssue: ProjectIssue = {
          ...movedIssue,
          sprintId: isBacklogSection(targetSectionId) ? null : targetSprintId,
        }
        upsertApiIssue(nextIssue)

        return {
          ...prev,
          [sourceSectionId]: {
            ...source,
            issues: source.issues.filter((item) => item.id !== issueId),
            total: Math.max(0, source.total - 1),
          },
          [targetSectionId]: {
            ...target,
            issues: mergeItemsById([nextIssue], target.issues),
            total: target.total + 1,
            initialized: target.initialized || true,
          },
        }
      })

      setSections((prev) =>
        prev.map((section) => {
          if (section.sectionId === sourceSectionId) {
            return {
              ...section,
              issueCount: Math.max(0, section.issueCount - 1),
            }
          }
          if (section.sectionId === targetSectionId) {
            return { ...section, issueCount: section.issueCount + 1 }
          }
          return section
        }),
      )
    },
    [],
  )

  const rollbackIssueMove = useCallback(
    (
      issueId: string,
      sourceSectionId: string,
      targetSectionId: string,
      issue: ProjectIssue,
    ) => {
      moveIssueBetweenSections(issueId, targetSectionId, sourceSectionId, issue)
    },
    [moveIssueBetweenSections],
  )

  const appendIssueToSection = useCallback((sectionId: string, issue: ProjectIssue) => {
    upsertApiIssue(issue)
    setSectionStates((prev) => {
      const current = prev[sectionId] ?? createEmptySectionState<ProjectIssue>()
      return {
        ...prev,
        [sectionId]: {
          ...current,
          issues: mergeItemsById(current.issues, [issue]),
          total: current.total + 1,
          initialized: current.initialized,
        },
      }
    })
    setSections((prev) =>
      prev.map((section) =>
        section.sectionId === sectionId
          ? { ...section, issueCount: section.issueCount + 1 }
          : section,
      ),
    )
  }, [])

  const mergedSections = useMemo(
    () =>
      sections.map((section) => {
        const state = sectionStates[section.sectionId] ?? createEmptySectionState<ProjectIssue>()
        return {
          ...section,
          issues: state.issues,
          pagination: {
            page: state.page,
            hasNext: state.hasNext,
            loading: state.loading,
            total: state.total,
            initialized: state.initialized,
          },
        }
      }),
    [sections, sectionStates],
  )

  return {
    sections: mergedSections,
    loading,
    error,
    refreshBacklog,
    initializeSection,
    loadMoreSection,
    moveIssueBetweenSections,
    rollbackIssueMove,
    appendIssueToSection,
  }
}

export type BacklogSectionWithPagination = BacklogSectionMeta & {
  issues: ProjectIssue[]
  pagination: {
    page: number
    hasNext: boolean
    loading: boolean
    total: number
    initialized: boolean
  }
}
