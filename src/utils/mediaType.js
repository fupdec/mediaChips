export const MEDIA_TYPE_VIDEO = 'video'
export const MEDIA_TYPE_IMAGE = 'image'

export const normalizeMediaTypeKey = (value) => String(value || '').trim().toLowerCase()

export const getMediaTypeKey = (mediaType) => normalizeMediaTypeKey(mediaType?.type || mediaType?.name)

export const isVideoMediaType = (mediaType) => getMediaTypeKey(mediaType) === MEDIA_TYPE_VIDEO

export const isImageMediaType = (mediaType) => getMediaTypeKey(mediaType) === MEDIA_TYPE_IMAGE

export const isEditableMediaType = (mediaType) => isVideoMediaType(mediaType) || isImageMediaType(mediaType)

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
