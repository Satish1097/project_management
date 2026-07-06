const ORG_KEY = 'devflow_current_org'
const PROJECT_KEY = 'devflow_current_project'

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore storage failures in private browsing, etc.
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage failures in private browsing, etc.
  }
}

export function getStoredOrganizationId(): string | null {
  return safeGetItem(ORG_KEY)
}

export function getStoredProjectId(): string | null {
  return safeGetItem(PROJECT_KEY)
}

export function setStoredOrganizationId(organizationId: string): void {
  safeSetItem(ORG_KEY, organizationId)
}

export function setStoredProjectId(projectId: string): void {
  safeSetItem(PROJECT_KEY, projectId)
}

export function clearContextSelection(): void {
  safeRemoveItem(ORG_KEY)
  safeRemoveItem(PROJECT_KEY)
}
