import _ from 'lodash'
import { typedApi } from '@/services/typedApi'
import type { WatchedFolderLink } from '@shared/entities/watched-folder'
import type { WatchedFolderEntry } from '@/services/watcherUtils'

export async function getWatchedFolders(): Promise<WatchedFolderEntry[]> {
  try {
    const res = await typedApi.getMediaTypesInWatchedFolders()
    const watchedFolders: WatchedFolderLink[] = res.data

    const types: Record<number, WatchedFolderLink['mediaType'][]> = {}

    for (const i of watchedFolders) {
      const id = i.folderId
      if (!types[id]) types[id] = []
      if (i.mediaType) types[id].push(i.mediaType)
    }

    const folders = _.uniqBy(watchedFolders, (i) => i.folderId)

    return folders.map((i): WatchedFolderEntry => {
      const folder = { ...i.watchedFolder }
      return {
        ...folder,
        path: String(folder.path ?? ''),
        types: types[i.folderId] || [],
      }
    })
  } catch (e) {
    console.error('getWatchedFolders error:', e)
    return []
  }
}
