import dotenv from 'dotenv'
import { app } from './app.js'

// Load environment variables from .env if present
dotenv.config()

function resolvePort(): number {
  const DEFAULT_PORT = 3001
  const rawPort = process.env.PORT

  if (!rawPort) {
    return DEFAULT_PORT
  }

  const parsed = Number(rawPort)
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
    return parsed
  }

  console.warn(`[VeloraAPI] Warning: Invalid PORT "${rawPort}" provided. Falling back to default port ${DEFAULT_PORT}.`)
  return DEFAULT_PORT
}

const PORT = resolvePort()

export const server = app.listen(PORT, () => {
  console.log(`[VeloraAPI] Server listening on http://localhost:${PORT}`)
})

// Graceful termination handling
process.on('SIGTERM', () => {
  console.log('[VeloraAPI] SIGTERM received, closing server gracefully...')
  server.close(() => {
    console.log('[VeloraAPI] Server closed.')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[VeloraAPI] SIGINT received, closing server gracefully...')
  server.close(() => {
    console.log('[VeloraAPI] Server closed.')
    process.exit(0)
  })
})
