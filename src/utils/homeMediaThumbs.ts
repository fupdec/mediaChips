import { getMediaDeleteAssetFolder } from '@/utils/mediaType'
import { loadMediaThumbUrl } from '@/utils/mediaThumbLoader'
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
  mediaPath: string,
): Promise<void> {
  if (!items?.length || !mediaPath) return

  await Promise.all(items.map(async (item) => {
    const folder = getThumbMediaType(mediaTypes, item.mediaTypeId)
    item.thumb = await loadMediaThumbUrl(mediaPath, folder, item.id)
  }))
}
