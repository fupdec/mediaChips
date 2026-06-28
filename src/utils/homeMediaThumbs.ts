import { apiClient } from '@/services/apiClient'
import { getMediaDeleteAssetFolder } from '@/utils/mediaType'
import type { MediaType } from '@/types/media'

interface HomeMediaItem {
  id: number
  mediaTypeId?: number
  thumb?: string | null
}

function getThumbMediaType(mediaTypes: MediaType[], mediaTypeId: number | undefined): string {
  const mediaType = mediaTypes.find((item) => item.id === Number(mediaTypeId))
  return getMediaDeleteAssetFolder(mediaType) || 'videos'
}

export async function loadHomeMediaThumbs(
  items: HomeMediaItem[],
  mediaTypes: MediaType[],
): Promise<void> {
  if (!items?.length) return

  const idsByFolder = new Map<string, number[]>()

  for (const item of items) {
    const folder = getThumbMediaType(mediaTypes, item.mediaTypeId)
    if (!idsByFolder.has(folder)) idsByFolder.set(folder, [])
    idsByFolder.get(folder)!.push(item.id)
  }

  const thumbsById: Record<number, string> = {}

  await Promise.all([...idsByFolder.entries()].map(async ([mediaType, ids]) => {
    try {
      const response = await apiClient.post<{ thumbs?: Record<number, string> }>('/api/media/thumbs', {
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
