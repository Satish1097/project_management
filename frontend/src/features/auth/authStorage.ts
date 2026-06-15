import type { AuthTokens, AuthUser } from './types'

const ACCESS_TOKEN_KEY = 'devflow_access_token'
const REFRESH_TOKEN_KEY = 'devflow_refresh_token'
const USER_KEY = 'devflow_user'

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

export function getAccessToken(): string | null {
  return safeGetItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return safeGetItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const raw = safeGetItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function hasAuthSession(): boolean {
  return Boolean(getAccessToken() && getRefreshToken())
}

export function setAuthSession(tokens: AuthTokens, user: AuthUser): void {
  safeSetItem(ACCESS_TOKEN_KEY, tokens.access)
  safeSetItem(REFRESH_TOKEN_KEY, tokens.refresh)
  safeSetItem(USER_KEY, JSON.stringify(user))
}

export function updateTokens(tokens: AuthTokens): void {
  safeSetItem(ACCESS_TOKEN_KEY, tokens.access)
  safeSetItem(REFRESH_TOKEN_KEY, tokens.refresh)
}

export function setStoredUser(user: AuthUser): void {
  safeSetItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession(): void {
  safeRemoveItem(ACCESS_TOKEN_KEY)
  safeRemoveItem(REFRESH_TOKEN_KEY)
  safeRemoveItem(USER_KEY)
}
