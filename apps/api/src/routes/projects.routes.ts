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
