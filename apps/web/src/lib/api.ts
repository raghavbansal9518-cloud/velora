export interface Project {
  id: string
  name: string
  targetUrl: string
  settings: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface PaginationMetadata {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CreateProjectInput {
  name: string
  targetUrl: string
  settings?: Record<string, unknown>
}

export interface FetchProjectsParams {
  page?: number
  limit?: number
}

export interface FetchProjectsResult {
  projects: Project[]
  pagination: PaginationMetadata
}

export class ApiError extends Error {
  readonly status: number
  readonly details?: Record<string, string>

  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

interface BackendSuccessEnvelope<T> {
  status: 'success'
  data: T
  pagination?: PaginationMetadata
}

interface BackendErrorEnvelope {
  error?: string
  message?: string
  details?: Record<string, string>
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    throw new ApiError(0, 'Unable to connect to the server. Please check your network connection.')
  }

  let body: unknown = null
  const contentType = res.headers.get('content-type')

  if (contentType && contentType.includes('application/json')) {
    try {
      body = await res.json()
    } catch {
      body = null
    }
  } else {
    try {
      const text = await res.text()
      if (text) {
        try {
          body = JSON.parse(text)
        } catch {
          body = { message: text }
        }
      }
    } catch {
      body = null
    }
  }

  if (!res.ok) {
    const errorBody = (body && typeof body === 'object' ? body : {}) as BackendErrorEnvelope
    const message =
      errorBody.message ||
      (res.status === 404 ? 'Resource not found' : `Request failed with status ${res.status}`)
    const details =
      errorBody.details && typeof errorBody.details === 'object'
        ? errorBody.details
        : undefined

    throw new ApiError(res.status, message, details)
  }

  return body as T
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const payload: Record<string, unknown> = {
    name: input.name,
    targetUrl: input.targetUrl,
  }

  if (input.settings !== undefined) {
    payload.settings = input.settings
  }

  const response = await apiRequest<BackendSuccessEnvelope<Project>>('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function fetchProjects(params?: FetchProjectsParams): Promise<FetchProjectsResult> {
  const searchParams = new URLSearchParams()
  if (params?.page !== undefined) searchParams.set('page', String(params.page))
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit))

  const queryString = searchParams.toString()
  const url = queryString ? `/api/projects?${queryString}` : '/api/projects'

  const response = await apiRequest<BackendSuccessEnvelope<Project[]>>(url)

  return {
    projects: response.data,
    pagination: response.pagination ?? {
      page: 1,
      limit: response.data.length,
      total: response.data.length,
      totalPages: 1,
    },
  }
}
