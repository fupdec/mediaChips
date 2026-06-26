import _ from 'lodash'
import {apiClient} from '@/services/apiClient'

export async function getWatchedFolders() {
  try {
    const res = await apiClient.get('/api/MediaTypesInWatchedFolders')
    const watchedFolders = res.data

    const types = {}

    for (const i of watchedFolders) {
      const id = i.folderId
      if (!types[id]) types[id] = []
      types[id].push(i.mediaType)
    }

    const folders = _.uniqBy(watchedFolders, (i) => i.folderId)

    return folders.map((i) => {
      const folder = {...i.watchedFolder}
      folder.types = types[i.folderId]
      return folder
    })
  } catch (e) {
    console.error('getWatchedFolders error:', e)
    return []
  }
}
