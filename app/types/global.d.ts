import type { ServerConfig } from './server'

declare global {
  var serverConfig: ServerConfig | undefined
  var serverApp: import('express').Express | undefined

  namespace NodeJS {
    interface Process {
      app_folder?: string
      server_config?: ServerConfig
      electron_app?: {
        getPath(name: string): string
      }
    }
  }
}

export {}
