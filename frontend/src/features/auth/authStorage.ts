const AUTH_STORAGE_KEY = 'devflow_auth_session'

export function readAuthSession(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated'
  } catch {
    return false
  }
}

export function writeAuthSession(authenticated: boolean): void {
  try {
    if (authenticated) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'authenticated')
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch {
    // Ignore storage failures in private browsing, etc.
  }
}
