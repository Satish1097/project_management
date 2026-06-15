import { DEFAULT_PROJECT_LABELS } from '@/constants/issueOptions'

let labels: string[] = [...DEFAULT_PROJECT_LABELS]

export function getLabels(): string[] {
  return [...labels]
}

export function addLabel(name: string): string {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return ''
  if (!labels.includes(normalized)) {
    labels = [...labels, normalized]
  }
  return normalized
}
