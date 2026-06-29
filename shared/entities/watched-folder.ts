import type { MediaType } from './media'

export interface WatchedFolderLink {
  folderId: number
  mediaTypeId?: number
  mediaType: MediaType
  watchedFolder: {
    path: string
    name?: string
    watch?: boolean
    [key: string]: unknown
  }
  [key: string]: unknown
}
