import type { MediaType } from '@/types/media'

export interface WatchedFolderEntry {
  path: string
  name?: string
  types: MediaType[]
  watch?: boolean
  id?: number
  folderId?: number
}

export function getWatchedFoldersExtensions(watchedFolders: WatchedFolderEntry[]) {
  const ext: Record<string, string[]> = {}

  watchedFolders.forEach((folder) => {
    let arr: string[] = []
    folder.types.forEach((type) => {
      arr = arr.concat((type.extensions || '').split(','))
    })
    ext[folder.path] = arr
  })

  return ext
}
