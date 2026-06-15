export type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  errors?: Record<string, string[]>
  status?: number

  constructor(message: string, errors?: Record<string, string[]>, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.errors = errors
    this.status = status
  }
}
