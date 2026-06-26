import path from 'path-browserify'
import {getLocalImage} from '@/services/fileService'

const isUnavailable = (src) => !src || src.includes('unavailable.png')

export async function loadImageDisplayUrl(media, mediaPath, {preferFull = false, cacheBust = false} = {}) {
  if (!media?.id) return null

  const thumbPath = path.join(mediaPath, 'images/thumbs', `${media.id}.jpg`)

  if (preferFull && media.path) {
    const full = await getLocalImage(media.path, true, cacheBust)
    if (!isUnavailable(full)) return full
  }

  const thumb = await getLocalImage(thumbPath, false, cacheBust)
  if (!isUnavailable(thumb)) return thumb

  if (media.path) {
    const full = await getLocalImage(media.path, true, cacheBust)
    if (!isUnavailable(full)) return full
  }

  return null
}

export async function loadThumbDisplayUrl(media, mediaPath) {
  if (!media?.id) return null

  const thumbPath = path.join(mediaPath, 'images/thumbs', `${media.id}.jpg`)
  const thumb = await getLocalImage(thumbPath)
  if (!isUnavailable(thumb)) return thumb

  return null
}

export async function loadFullImageDisplayUrl(media) {
  if (!media?.path) return null

  const full = await getLocalImage(media.path, true)
  return isUnavailable(full) ? null : full
}

export function revokeImageObjectUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
