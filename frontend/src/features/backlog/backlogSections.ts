export const BACKLOG_SECTION_ID = 'backlog'

export function sprintSectionId(sprintId: string): string {
  return `sprint-${sprintId}`
}

export function parseSprintIdFromSection(sectionId: string): string | null {
  if (sectionId === BACKLOG_SECTION_ID) return null
  if (sectionId.startsWith('sprint-')) {
    return sectionId.slice('sprint-'.length)
  }
  return null
}

export function isBacklogSection(sectionId: string): boolean {
  return sectionId === BACKLOG_SECTION_ID
}
