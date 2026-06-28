export interface MissingMediaSearchOptions {
  folders?: string[]
  shouldStop?: () => boolean
  onProgress?: (processed: number, total: number) => void
}
