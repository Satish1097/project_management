export type UserProfileInput = {
  userId?: string
  name: string
  color: string
  email?: string
  role?: string
  joinedAt?: string
}

export type UserProfileInfo = {
  userId?: string
  displayName: string
  name: string
  color: string
  email?: string
  role?: string
  joinedAt?: string
  avatarUrl?: string | null
  timezone?: string | null
}
