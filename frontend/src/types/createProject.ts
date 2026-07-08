export type ProjectTypeOption =
  | 'software'
  | 'marketing'
  | 'design'
  | 'operations'
  | 'custom'

export type ProjectMethodology = 'scrum' | 'kanban'

export type SprintDurationOption = '1' | '2' | '3' | '4' | 'custom'

export type CreateProjectFormValues = {
  name: string
  description: string
  methodology: ProjectMethodology
  sprintDuration: SprintDurationOption
}

export const DEFAULT_CREATE_PROJECT_VALUES: CreateProjectFormValues = {
  name: '',
  description: '',
  methodology: 'scrum',
  sprintDuration: '2',
}
