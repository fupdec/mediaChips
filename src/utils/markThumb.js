import path from 'path-browserify'
import {apiClient} from '@/services/apiClient'
import {checkFileExists, createThumb, getLocalImage} from '@/services/fileService'

export function formatMarkTimestamp(time) {
  return new Date(1000 * time).toISOString().substr(11, 12)
}

export function getMarkImagePath(mediaPath, markId) {
  return path.join(mediaPath || '', 'videos/marks', `${markId}.jpg`)
}

export function isMarkThumbUnavailable(src) {
  return !src || src.includes('unavailable.png')
}

export async function loadMarkImageDisplayUrl({
  markId,
  mediaPath,
  mediaId,
}) {
  if (!mediaPath || !markId) {
    return '/images/unavailable.png'
  }

  const markImagePath = getMarkImagePath(mediaPath, markId)
  const markImage = await getLocalImage(markImagePath)

  if (!isMarkThumbUnavailable(markImage)) {
    return markImage
  }

  if (mediaId) {
    const videoThumbPath = path.join(mediaPath, 'videos/thumbs', `${mediaId}.jpg`)
    const videoThumb = await getLocalImage(videoThumbPath)
    if (!isMarkThumbUnavailable(videoThumb)) {
      return videoThumb
    }
  }

  return markImage
}

function isMarkThumbAlreadyExistsError(error) {
  const message = error?.response?.data?.message
  return typeof message === 'string' && message.toLowerCase().includes('already exists')
}

export async function ensureMarkThumb({
  mark,
  videoPath,
  mediaPath,
  mediaId,
  onUpdated,
}) {
  if (!mark?.id) return 'skipped'

  const imgPath = mediaPath ? getMarkImagePath(mediaPath, mark.id) : null
  if (imgPath && await checkFileExists(imgPath)) {
    onUpdated?.(mark.id)
    return 'exists'
  }

  try {
    if (mediaId) {
      await apiClient.post('/api/Task/createMarkThumbForMark', {
        markId: mark.id,
        mediaId,
      })
      onUpdated?.(mark.id)
      return 'created'
    }

    if (!videoPath || !imgPath) return 'skipped'

    await createThumb(
      formatMarkTimestamp(mark.time),
      videoPath,
      imgPath,
      180,
    )
    onUpdated?.(mark.id)
    return 'created'
  } catch (error) {
    if (isMarkThumbAlreadyExistsError(error)) {
      onUpdated?.(mark.id)
      return 'exists'
    }
    throw error
  }
}
