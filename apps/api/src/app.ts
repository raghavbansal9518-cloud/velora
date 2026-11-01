import express, { type Request, type Response, type NextFunction } from 'express'
import { healthRouter } from './routes/health.routes.js'
import { projectsRouter } from './routes/projects.routes.js'

export const app = express()

// Middleware: Parse JSON request bodies with standard safe 100KB limit
app.use(express.json({ limit: '100kb' }))

// Mount API routes
app.use('/api', healthRouter)
app.use('/api', projectsRouter)

// 404 Handler for unknown routes (uses req.path to avoid reflecting sensitive query strings)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  })
})

// Centralized error-handling middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Gracefully handle JSON body syntax errors from body-parser
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: number }).status === 400 &&
    'body' in err
  ) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON request body',
    })
    return
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const statusCode =
    err && typeof err === 'object' && 'status' in err && typeof (err as { status: unknown }).status === 'number'
      ? (err as { status: number }).status
      : 500

  // Log error details on server side
  console.error('[ServerError]', err)

  res.status(statusCode).json({
    error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
    message: isProduction && statusCode === 500 ? 'An unexpected error occurred' : (err instanceof Error ? err.message : 'Internal Server Error'),
  })
})
