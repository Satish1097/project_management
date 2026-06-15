import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMe, login as loginApi, logout as logoutApi, register as registerApi } from '@/api/auth'
import type { RegisterPayload } from '@/api/auth'
import { setAuthFailureHandler } from '@/api/client'
import {
  clearAuthSession,
  getRefreshToken,
  getStoredUser,
  hasAuthSession,
  setAuthSession,
  setStoredUser,
} from './authStorage'
import type { AuthUser, LoginCredentials } from './types'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasAuthSession())
  const [isLoading, setIsLoading] = useState(() => hasAuthSession())

  const clearSession = useCallback(() => {
    clearAuthSession()
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  useEffect(() => {
    setAuthFailureHandler(clearSession)
  }, [clearSession])

  useEffect(() => {
    if (!hasAuthSession()) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function bootstrapSession() {
      try {
        const currentUser = await getMe()
        if (cancelled) return
        setStoredUser(currentUser)
        setUser(currentUser)
        setIsAuthenticated(true)
      } catch {
        if (cancelled) return
        clearSession()
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void bootstrapSession()

    return () => {
      cancelled = true
    }
  }, [clearSession])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { user: loggedInUser, tokens } = await loginApi(credentials)
    setAuthSession(tokens, loggedInUser)
    setUser(loggedInUser)
    setIsAuthenticated(true)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user: registeredUser, tokens } = await registerApi(payload)
    setAuthSession(tokens, registeredUser)
    setUser(registeredUser)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      await logoutApi(refreshToken)
    }
    clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({ user, isAuthenticated, isLoading, login, register, logout }),
    [user, isAuthenticated, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
