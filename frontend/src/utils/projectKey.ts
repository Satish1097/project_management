const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'for',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
])

export const PROJECT_NAME_MAX_LENGTH = 80
export const PROJECT_KEY_MAX_LENGTH = 10
export const PROJECT_DESCRIPTION_MAX_LENGTH = 500

/** Jira-style key from project name (e.g. Mobile App → MOB, Backend API → API). */
export function generateProjectKey(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
  if (words.length === 0) return ''

  const significant = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()))
  const use = significant.length > 0 ? significant : words

  if (use.length === 1) {
    return sanitizeKeyPart(use[0]).slice(0, 3)
  }

  const last = sanitizeKeyPart(use[use.length - 1])
  if (last.length >= 2 && last.length <= 4) {
    return last.slice(0, PROJECT_KEY_MAX_LENGTH)
  }

  return sanitizeKeyPart(use[0]).slice(0, 3)
}

function sanitizeKeyPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

export function normalizeProjectKey(value: string): string {
  return sanitizeKeyPart(value).slice(0, PROJECT_KEY_MAX_LENGTH)
}

export function isValidProjectKey(key: string): boolean {
  return /^[A-Z0-9]{2,10}$/.test(key)
}

export function isProjectKeyTaken(
  key: string,
  existingKeys: readonly string[],
  ignoreKey?: string,
): boolean {
  const normalized = key.toUpperCase()
  if (ignoreKey && normalized === ignoreKey.toUpperCase()) return false
  return existingKeys.some((k) => k.toUpperCase() === normalized)
}
