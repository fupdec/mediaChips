/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'path-browserify' {
  const path: {
    join: (...parts: string[]) => string
    extname: (filePath: string) => string
    dirname: (filePath: string) => string
    basename: (filePath: string) => string
    dirname: (filePath: string) => string
    [key: string]: unknown
  }
  export default path
}

interface UpdaterState {
  state: string
  [key: string]: unknown
}

interface ElectronUpdaterAPI {
  isSupported: () => Promise<boolean>
  onStatus: (listener: (payload: UpdaterState) => void) => () => void
  getState: () => Promise<UpdaterState | null>
  check: () => Promise<UpdaterState>
  download: () => Promise<UpdaterState>
  install: () => Promise<void>
}

interface ElectronAPI {
  invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>
  send?: (channel: string, ...args: unknown[]) => void
  getPathForFile?: (file: File) => string
  on?: (channel: string, listener: (...args: unknown[]) => void) => (() => void) | void
  removeListener?: (channel: string, listener: (...args: unknown[]) => void) => void
  updater?: ElectronUpdaterAPI
  [key: string]: unknown
}

interface Window {
  electronAPI?: ElectronAPI
  os?: string
  showNotification?: (text: string, type: string) => void
}
