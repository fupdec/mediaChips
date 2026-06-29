declare module 'archiver' {
  import type { WriteStream } from 'fs'

  interface Archiver {
    pipe(destination: WriteStream): void
    directory(source: string, destPath?: string | false): void
    file(source: string, data: { name: string }): void
    finalize(): void
    on(event: string, listener: (...args: unknown[]) => void): void
  }

  function archiver(format: string, options?: Record<string, unknown>): Archiver

  export = archiver
}
