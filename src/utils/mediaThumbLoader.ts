import path from 'path-browserify'
import { getLocalImage } from '@/services/fileService'

const THUMB_SUBFOLDERS = ['thumbs', 'grids'] as const
const UNAVAILABLE_MARKER = 'unavailable.png'

export async function loadMediaThumbUrl(
  mediaPath: string,
  mediaTypeFolder: string,
  id: number | string,
): Promise<string | null> {
  if (!mediaPath || id == null) return null

  for (const subfolder of THUMB_SUBFOLDERS) {
    const imgPath = path.join(mediaPath, mediaTypeFolder, subfolder, `${id}.jpg`)
    const url = await getLocalImage(imgPath)
    if (url && !url.includes(UNAVAILABLE_MARKER)) {
      return url
    }
  }

  return null
}

export async function loadMediaThumbUrls(
  mediaPath: string,
  mediaTypeFolder: string,
  ids: Array<number | string>,
): Promise<Record<number | string, string>> {
  const thumbs: Record<number | string, string> = {}

  await Promise.all(ids.map(async (id) => {
    const url = await loadMediaThumbUrl(mediaPath, mediaTypeFolder, id)
    if (url) {
      thumbs[id] = url
    }
  }))

  return thumbs
}
