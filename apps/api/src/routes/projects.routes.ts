import { Router, type Request, type Response } from 'express'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

export const projectsRouter = Router()

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  data?: {
    name: string
    targetUrl: string
    settings: Prisma.InputJsonObject | null
  }
}

const ALLOWED_BODY_FIELDS = new Set(['name', 'targetUrl', 'settings'])

export function validateCreateProjectInput(body: unknown): ValidationResult {
  const errors: Record<string, string> = {}

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return {
      isValid: false,
      errors: { body: 'Request body must be a plain JSON object' },
    }
  }

  const record = body as Record<string, unknown>

  // Reject unknown fields
  const unknownFields = Object.keys(record).filter((key) => !ALLOWED_BODY_FIELDS.has(key))
  if (unknownFields.length > 0) {
    errors.body = `Unknown field(s) not allowed: ${unknownFields.join(', ')}`
  }

  // Validate 'name'
  if (!('name' in record) || record.name === undefined) {
    errors.name = 'Project name is required'
  } else if (typeof record.name !== 'string') {
    errors.name = 'Project name must be a string'
  } else {
    const trimmedName = record.name.trim()
    if (trimmedName.length === 0) {
      errors.name = 'Project name cannot be empty'
    } else if (trimmedName.length > 191) {
      errors.name = 'Project name cannot exceed 191 characters'
    }
  }

  // Validate 'targetUrl'
  if (!('targetUrl' in record) || record.targetUrl === undefined) {
    errors.targetUrl = 'Target URL is required'
  } else if (typeof record.targetUrl !== 'string') {
    errors.targetUrl = 'Target URL must be a string'
  } else {
    const trimmedUrl = record.targetUrl.trim()
    if (trimmedUrl.length === 0) {
      errors.targetUrl = 'Target URL cannot be empty'
    } else if (trimmedUrl.length > 2048) {
      errors.targetUrl = 'Target URL cannot exceed 2048 characters'
    } else {
      try {
        const parsedUrl = new URL(trimmedUrl)
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          errors.targetUrl = 'Target URL must use http: or https: protocol'
        } else if (parsedUrl.username !== '' || parsedUrl.password !== '') {
          errors.targetUrl = 'Target URL must not contain embedded credentials (username or password)'
        }
      } catch {
        errors.targetUrl = 'Target URL must be a valid, parseable URL'
      }
    }
  }

  // Validate 'settings' (optional)
  let validatedSettings: Prisma.InputJsonObject | null = null
  if ('settings' in record && record.settings !== undefined) {
    const s = record.settings
    if (typeof s !== 'object' || s === null || Array.isArray(s)) {
      errors.settings = 'Settings must be a non-null plain JSON object'
    } else {
      const proto = Object.getPrototypeOf(s)
      if (proto !== Object.prototype && proto !== null) {
        errors.settings = 'Settings must be a non-null plain JSON object'
      } else {
        validatedSettings = s as Prisma.InputJsonObject
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: {},
    data: {
      name: (record.name as string).trim(),
      targetUrl: (record.targetUrl as string).trim(),
      settings: validatedSettings,
    },
  }
}

// -------------------------------------------------------------
// Pagination & UUID Validation Helpers
// -------------------------------------------------------------

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_QUERY_PARAMS = new Set(['page', 'limit'])

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginationValidationResult {
  isValid: boolean
  errors: Record<string, string>
  params?: PaginationParams
}

export function validatePaginationQuery(query: Record<string, unknown>): PaginationValidationResult {
  const errors: Record<string, string> = {}

  // Reject duplicate query parameters (Express presents duplicate keys as arrays)
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      errors[key] = `Duplicate query parameter '${key}' is not allowed`
    }
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors }
  }

  // Reject unknown query parameters
  for (const key of Object.keys(query)) {
    if (!ALLOWED_QUERY_PARAMS.has(key)) {
      errors[key] = `Unknown query parameter '${key}' is not allowed`
    }
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors }
  }

  let page = 1
  let limit = 10

  if (query.page !== undefined) {
    if (typeof query.page !== 'string' || !/^[1-9]\d*$/.test(query.page.trim())) {
      errors.page = 'Page must be a positive integer'
    } else {
      const parsedPage = Number(query.page.trim())
      if (!Number.isSafeInteger(parsedPage) || parsedPage < 1) {
        errors.page = 'Page must be a positive safe integer'
      } else {
        page = parsedPage
      }
    }
  }

  if (query.limit !== undefined) {
    if (typeof query.limit !== 'string' || !/^[1-9]\d*$/.test(query.limit.trim())) {
      errors.limit = 'Limit must be an integer between 1 and 100'
    } else {
      const parsedLimit = Number(query.limit.trim())
      if (!Number.isSafeInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        errors.limit = 'Limit must be an integer between 1 and 100'
      } else {
        limit = parsedLimit
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors }
  }

  // Check for safe arithmetic: skip = (page - 1) * limit
  const skip = (page - 1) * limit
  if (!Number.isSafeInteger(skip) || skip > Number.MAX_SAFE_INTEGER) {
    return {
      isValid: false,
      errors: { page: 'Pagination offset exceeds safe numerical limits' },
    }
  }

  return {
    isValid: true,
    errors: {},
    params: { page, limit, skip },
  }
}

export function isValidUuid(id: unknown): id is string {
  if (typeof id !== 'string') return false
  return UUID_REGEX.test(id.trim())
}

// -------------------------------------------------------------
// Route Handlers
// -------------------------------------------------------------

// POST /api/projects — Register a new project
projectsRouter.post('/projects', async (req: Request, res: Response) => {
  const validation = validateCreateProjectInput(req.body)

  if (!validation.isValid || !validation.data) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Validation failed',
      details: validation.errors,
    })
    return
  }

  const { name, targetUrl, settings } = validation.data

  const project = await prisma.project.create({
    data: {
      name,
      targetUrl,
      settings: settings ?? undefined,
    },
  })

  res.status(201).json({
    status: 'success',
    data: project,
  })
})

// GET /api/projects — List projects with pagination
projectsRouter.get('/projects', async (req: Request, res: Response) => {
  const validation = validatePaginationQuery(req.query as Record<string, unknown>)

  if (!validation.isValid || !validation.params) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid pagination query parameters',
      details: validation.errors,
    })
    return
  }

  const { page, limit, skip } = validation.params

  const [total, projects] = await Promise.all([
    prisma.project.count(),
    prisma.project.findMany({
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        name: true,
        targetUrl: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  res.status(200).json({
    status: 'success',
    data: projects,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  })
})

// GET /api/projects/:projectId — Retrieve a single project
projectsRouter.get('/projects/:projectId', async (req: Request, res: Response) => {
  const { projectId } = req.params

  if (!isValidUuid(projectId)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid project ID format',
      details: {
        projectId: 'Project ID must be a valid UUID',
      },
    })
    return
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      targetUrl: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!project) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Project not found',
    })
    return
  }

  res.status(200).json({
    status: 'success',
    data: project,
  })
})
