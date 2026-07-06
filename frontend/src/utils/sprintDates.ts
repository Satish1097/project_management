import type { SprintDurationWeeks } from '@/types/sprints'

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  const sameYear = start.getFullYear() === end.getFullYear()
  const startFmt = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
  const endFmt = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${startFmt} → ${endFmt}`
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addWeeks(startIso: string, weeks: number): string {
  const date = parseIsoDate(startIso)
  date.setDate(date.getDate() + weeks * 7 - 1)
  return toIsoDate(date)
}

export function weeksBetween(startIso: string, endIso: string): number {
  const start = parseIsoDate(startIso)
  const end = parseIsoDate(endIso)
  const diff = end.getTime() - start.getTime()
  return Math.max(1, Math.round(diff / (7 * 24 * 60 * 60 * 1000)))
}

export function durationWeeksFromDates(
  startIso: string,
  endIso: string,
): SprintDurationWeeks {
  const w = weeksBetween(startIso, endIso)
  if (w <= 1) return '1'
  if (w <= 2) return '2'
  if (w <= 3) return '3'
  if (w <= 4) return '4'
  return 'custom'
}

export function endDateFromDuration(
  startIso: string,
  duration: SprintDurationWeeks,
): string {
  const weeks = duration === 'custom' ? 2 : Number(duration)
  return addWeeks(startIso, weeks)
}

export function isEndAfterStart(startIso: string, endIso: string): boolean {
  return parseIsoDate(endIso).getTime() > parseIsoDate(startIso).getTime()
}

export function computeSprintProgress(
  completed: number,
  total: number,
): number {
  if (total <= 0) return 0
  return Math.round((completed / total) * 100)
}

export function computeDaysRemaining(endIso: string): number {
  const end = parseIsoDate(endIso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diff = Math.ceil((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  return Math.max(0, diff)
}
