export type AuthUser = {
  id: string
  email: string
  display_name: string
  avatar: string | null
  timezone: string | null
  is_superuser?: boolean
}

export type LoginCredentials = {
  email: string
  password: string
  rememberMe?: boolean
}

export type AuthTokens = {
  access: string
  refresh: string
}
