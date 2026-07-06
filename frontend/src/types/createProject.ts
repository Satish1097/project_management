export type ProjectTypeOption =
  | 'software'
  | 'marketing'
  | 'design'
  | 'operations'
  | 'custom'

export type ProjectMethodology = 'scrum' | 'kanban'

export type ProjectVisibility = 'private' | 'workspace'

export type SprintDurationOption = '1' | '2' | '3' | '4' | 'custom'

export type CreateProjectFormValues = {
  name: string
  key: string
  description: string
  projectType: ProjectTypeOption
  methodology: ProjectMethodology
  visibility: ProjectVisibility
  leadId: string
  memberIds: string[]
  sprintDuration: SprintDurationOption
}

export const DEFAULT_CREATE_PROJECT_VALUES: CreateProjectFormValues = {
  name: '',
  key: '',
  description: '',
  projectType: 'software',
  methodology: 'scrum',
  visibility: 'private',
  leadId: '',
  memberIds: [],
  sprintDuration: '2',
}
