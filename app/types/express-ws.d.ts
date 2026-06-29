declare module 'express-ws' {
  import type { Express } from 'express'

  function expressWs(app: Express, server?: unknown, options?: Record<string, unknown>): void

  export = expressWs
}
