import type { AnyRecord } from '../types/db'
export {}

declare global {
  namespace NodeJS {
    interface Process {
      app_folder?: string
      resourcesPath?: string
      server_config?: unknown
      electron_app?: {
        getPath(name: string): string
      }
    }
  }
}

export type { AnyRecord } from './db'
