import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'
import type { AuthTokens, AuthUser, LoginCredentials } from '@/features/auth/types'

type LoginResponseData = {
  user: AuthUser
  tokens: AuthTokens
}

type RefreshResponseData = {
  access: string
  refresh: string
}

export type InvitationDetails = {
  email: string
  account_exists: boolean
  metadata: Record<string, unknown>
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const response = (error as { response: { data?: ApiResponse; status?: number } }).response
    const data = response.data
    const message = data?.message || 'Request failed.'
    return new ApiError(message, data?.errors, response.status)
  }

  return new ApiError('Network error. Please try again.')
}

export async function login(
  credentials: LoginCredentials,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  const { email, password, rememberMe } = credentials
  const payload = {
    email: email.trim().toLowerCase(),
    password,
    remember_me: rememberMe ?? false,
  }

  try {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>(
      '/auth/login',
      payload,
    )

    const result = response.data.data
    if (!result?.user || !result?.tokens) {
      throw new ApiError('Unexpected login response.')
    }

    return result
  } catch (error) {
    throw toApiError(error)
  }
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  try {
    const { data } = await apiClient.post<ApiResponse<RefreshResponseData>>('/auth/refresh', {
      refresh: refreshToken,
    })
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    await apiClient.post('/auth/logout', { refresh: refreshToken })
  } catch {
    // Clear local session even if the server rejects the token.
  }
}

export type RegisterPayload = {
  invite_token?: string
  email?: string
  name: string
  password: string
}

export async function register(
  payload: RegisterPayload,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  try {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>(
      '/auth/register',
      payload,
    )

    const result = response.data.data
    if (!result?.user || !result?.tokens) {
      throw new ApiError('Unexpected registration response.')
    }

    return result
  } catch (error) {
    throw toApiError(error)
  }
}

export async function validateInvitation(inviteToken: string): Promise<InvitationDetails> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ invitation: InvitationDetails }>>(
      '/auth/invitations/validate',
      { params: { invite_token: inviteToken } },
    )

    if (!data.data?.invitation) {
      throw new ApiError('Unexpected invitation response.')
    }

    return data.data.invitation
  } catch (error) {
    throw toApiError(error)
  }
}

export async function acceptInvitation(inviteToken: string): Promise<AuthUser> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ user: AuthUser }>>(
      '/auth/invitations/accept',
      { invite_token: inviteToken },
    )

    if (!data.data?.user) {
      throw new ApiError('Unexpected invitation response.')
    }

    return data.data.user
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getMe(): Promise<AuthUser> {
  try {
    const { data } = await apiClient.get<ApiResponse<AuthUser>>('/me')
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}
