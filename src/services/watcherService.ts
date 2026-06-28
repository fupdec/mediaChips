import _ from 'lodash'
import { apiClient } from '@/services/apiClient'
import type { MediaType } from '@/types/media'

interface WatchedFolderLink {
  folderId: number
  mediaType: MediaType
  watchedFolder: {
    path: string
    watch?: boolean
    [key: string]: unknown
  }
}

export async function getWatchedFolders() {
  try {
    const res = await apiClient.get<WatchedFolderLink[]>('/api/MediaTypesInWatchedFolders')
    const watchedFolders = res.data

    const types: Record<number, MediaType[]> = {}

    for (const i of watchedFolders) {
      const id = i.folderId
      if (!types[id]) types[id] = []
      types[id].push(i.mediaType)
    }

    const folders = _.uniqBy(watchedFolders, (i) => i.folderId)

    return folders.map((i) => {
      const folder = { ...i.watchedFolder }
      return {
        ...folder,
        types: types[i.folderId],
      }
    })
  } catch (e) {
    console.error('getWatchedFolders error:', e)
    return []
  }
}
