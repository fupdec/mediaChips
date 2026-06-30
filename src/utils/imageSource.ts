import path from 'path-browserify'
import { getLocalImage } from '@/services/fileService'
import { getCachedThumb, mediaThumbKey, isPersistentThumbUrl, setCachedThumb } from '@/utils/thumbDisplayCache'

interface MediaWithPath {
  id?: number
  path?: string
}

const isUnavailable = (src: string | null | undefined): boolean => !src || src.includes('unavailable.png')

const rememberImageThumb = (mediaId: number | string, src: string | null | undefined) => {
  if (!isPersistentThumbUrl(src)) return
  setCachedThumb(mediaThumbKey('images', mediaId), src)
}

export async function loadImageDisplayUrl(
  media: MediaWithPath | null | undefined,
  mediaPath: string,
  { preferFull = false, cacheBust = false } = {},
): Promise<string | null> {
  if (!media?.id) return null

  if (!cacheBust) {
    const cached = getCachedThumb(mediaThumbKey('images', media.id))
    if (isPersistentThumbUrl(cached)) return cached!
  }

  const thumbPath = path.join(mediaPath, 'images/thumbs', `${media.id}.jpg`)

  if (preferFull && media.path) {
    const full = await getLocalImage(media.path, true, cacheBust)
    if (!isUnavailable(full)) {
      rememberImageThumb(media.id, full)
      return full
    }
  }

  const thumb = await getLocalImage(thumbPath, false, cacheBust)
  if (!isUnavailable(thumb)) {
    rememberImageThumb(media.id, thumb)
    return thumb
  }

  if (media.path) {
    const full = await getLocalImage(media.path, true, cacheBust)
    if (!isUnavailable(full)) {
      rememberImageThumb(media.id, full)
      return full
    }
  }

  return null
}

export async function loadThumbDisplayUrl(
  media: MediaWithPath | null | undefined,
  mediaPath: string,
): Promise<string | null> {
  if (!media?.id) return null

  const thumbPath = path.join(mediaPath, 'images/thumbs', `${media.id}.jpg`)
  const thumb = await getLocalImage(thumbPath)
  if (!isUnavailable(thumb)) return thumb

  return null
}

export async function loadFullImageDisplayUrl(media: MediaWithPath | null | undefined): Promise<string | null> {
  if (!media?.path) return null

  const full = await getLocalImage(media.path, true)
  return isUnavailable(full) ? null : full
}

export function revokeImageObjectUrl(url: string | null | undefined): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
