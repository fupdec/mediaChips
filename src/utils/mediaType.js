export const MEDIA_TYPE_VIDEO = 'video'
export const MEDIA_TYPE_IMAGE = 'image'
export const MEDIA_TYPE_AUDIO = 'audio'
export const MEDIA_TYPE_TEXT = 'text'

export const normalizeMediaTypeKey = (value) => String(value || '').trim().toLowerCase()

export const getMediaTypeKey = (mediaType) => normalizeMediaTypeKey(mediaType?.type || mediaType?.name)

export const isVideoMediaType = (mediaType) => getMediaTypeKey(mediaType) === MEDIA_TYPE_VIDEO

export const isImageMediaType = (mediaType) => getMediaTypeKey(mediaType) === MEDIA_TYPE_IMAGE

export const isAudioMediaType = (mediaType) => getMediaTypeKey(mediaType) === MEDIA_TYPE_AUDIO

export const isTextMediaType = (mediaType) => getMediaTypeKey(mediaType) === MEDIA_TYPE_TEXT

export const isEditableMediaType = (mediaType) =>
  isVideoMediaType(mediaType) ||
  isImageMediaType(mediaType) ||
  isAudioMediaType(mediaType) ||
  isTextMediaType(mediaType)

export const isManagedMediaType = (mediaType) => isEditableMediaType(mediaType)

export const findMediaTypeById = (mediaTypes, id) => {
  if (!mediaTypes?.length || id == null) return null
  return mediaTypes.find(item => item.id === Number(id)) || null
}

export const getCurrentMediaType = (mediaTypes, mediaTypeId) => findMediaTypeById(mediaTypes, mediaTypeId)

export const getDefaultMediaTypeId = (mediaTypes) => {
  const videoType = mediaTypes?.find(isVideoMediaType)
  return videoType?.id ?? mediaTypes?.[0]?.id ?? null
}

export const getMediaDeleteAssetFolder = (mediaType) => {
  const key = getMediaTypeKey(mediaType)
  if (key === MEDIA_TYPE_VIDEO) return 'videos'
  if (key === MEDIA_TYPE_IMAGE) return 'images'
  if (key === MEDIA_TYPE_AUDIO) return 'audios'
  if (key === MEDIA_TYPE_TEXT) return 'texts'
  return null
}

export const mediaTypeMatches = (mediaType, allowedTypes = []) => {
  if (!allowedTypes?.length) return true
  const key = getMediaTypeKey(mediaType)
  return allowedTypes.some(type => normalizeMediaTypeKey(type) === key)
}

export const matchesMediaTypeFilter = (param, mediaType) => {
  if (param.media_types?.length) {
    return mediaTypeMatches(mediaType, param.media_types)
  }

  if (param.media_type_id?.length) {
    return param.media_type_id.includes(Number(mediaType?.id))
  }

  return true
}

export function getMenuOrderedMediaTypes(mediaTypes) {
  return [...(mediaTypes || [])]
    .filter(item => !item.hidden)
    .sort((a, b) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0)
      if (orderDiff !== 0) return orderDiff
      return String(a.name || '').localeCompare(String(b.name || ''))
    })
}

export function sortByMenuMediaTypeOrder(items, mediaTypes, getMediaTypeId = (item) => (
  item.mediaType?.id ?? item.mediaTypeId
)) {
  const orderById = new Map(
    getMenuOrderedMediaTypes(mediaTypes).map((mediaType, index) => [mediaType.id, index])
  )

  return [...items].sort((a, b) => {
    const aOrder = orderById.get(Number(getMediaTypeId(a))) ?? Number.MAX_SAFE_INTEGER
    const bOrder = orderById.get(Number(getMediaTypeId(b))) ?? Number.MAX_SAFE_INTEGER
    return aOrder - bOrder
  })
}
