import type { ApiDb } from '../../api/types/db'
import { createAuthService } from './auth'

let authService: ReturnType<typeof createAuthService> | null = null

function initAuthService(db: ApiDb) {
  if (!authService) {
    authService = createAuthService(db)
  }
  return authService
}

function getAuthService(): ReturnType<typeof createAuthService> {
  if (!authService) {
    throw new Error('Auth service is not initialized')
  }
  return authService
}

export { initAuthService, getAuthService }
