import type { ApiDb } from '../../api/types/db'

const {createAuthService} = require('./auth')

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

module.exports = {
  initAuthService,
  getAuthService,
}
