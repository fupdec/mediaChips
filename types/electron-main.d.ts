import type { App } from 'electron'

declare global {
  namespace NodeJS {
    interface Process {
      electron_app?: App
    }
  }

  function createProtocol(scheme: string): void
}

export {}
