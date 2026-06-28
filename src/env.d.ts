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

declare module 'vue-chartjs' {
  import type { DefineComponent } from 'vue'
  export const Line: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export const Bar: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
}

declare module 'chart.js' {
  export class Chart {
    static register(...items: unknown[]): void
  }
  export const Title: unknown
  export const Tooltip: unknown
  export const Legend: unknown
  export const LineElement: unknown
  export const LinearScale: unknown
  export const CategoryScale: unknown
  export const PointElement: unknown
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

interface OsAPI {
  platform: string
  homedir: string
  tmpdir: string
  arch: string
  type: string
  version: string
}

interface Window {
  electronAPI?: ElectronAPI
  osAPI?: OsAPI
  os?: string
  showNotification?: (text: string, type: string) => void
}
