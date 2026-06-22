import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {getMediaDeleteAssetFolder} from '@/utils/mediaType'

function getThumbMediaType(mediaTypes, mediaTypeId) {
  const mediaType = mediaTypes.find((item) => item.id === Number(mediaTypeId))
  return getMediaDeleteAssetFolder(mediaType) || 'videos'
}

export async function loadHomeMediaThumbs(items, mediaTypes) {
  if (!items?.length) return

  const idsByFolder = new Map()

  for (const item of items) {
    const folder = getThumbMediaType(mediaTypes, item.mediaTypeId)
    if (!idsByFolder.has(folder)) idsByFolder.set(folder, [])
    idsByFolder.get(folder).push(item.id)
  }

  const appStore = useAppStore()
  const thumbsById = {}

  await Promise.all([...idsByFolder.entries()].map(async ([mediaType, ids]) => {
    try {
      const response = await axios.post(`${appStore.localhost}/api/media/thumbs`, {
        ids,
        mediaType,
      })
      Object.assign(thumbsById, response.data?.thumbs || {})
    } catch (error) {
      console.log('Error loading home media thumbs:', error)
    }
  }))

  for (const item of items) {
    item.thumb = thumbsById[item.id] || null
  }
}
