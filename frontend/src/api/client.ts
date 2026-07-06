import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from './types'
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  updateTokens,
} from '@/features/auth/authStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let onAuthFailure: (() => void) | null = null
let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

export function setAuthFailureHandler(handler: () => void): void {
  onAuthFailure = handler
}

function processRefreshQueue(error: unknown, token: string | null = null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else if (token) {
      resolve(token)
    }
  })
  refreshQueue = []
}

function handleAuthFailure(): void {
  clearAuthSession()
  onAuthFailure?.()
}

async function performTokenRefresh(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  const { data } = await refreshClient.post<ApiResponse<{ access: string; refresh: string }>>(
    '/auth/refresh',
    { refresh: refreshToken },
  )

  const tokens = data.data
  updateTokens(tokens)
  return tokens.access
}

function shouldAttemptRefresh(
  error: AxiosError<ApiResponse>,
  request: InternalAxiosRequestConfig & { _retry?: boolean },
): boolean {
  if (error.response?.status !== 401) return false
  if (request._retry) return false

  const url = request.url ?? ''
  if (url.includes('/auth/login') || url.includes('/auth/refresh')) return false

  return Boolean(getRefreshToken())
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (!originalRequest || !shouldAttemptRefresh(error, originalRequest)) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const accessToken = await performTokenRefresh()
      processRefreshQueue(null, accessToken)
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      processRefreshQueue(refreshError, null)
      handleAuthFailure()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
