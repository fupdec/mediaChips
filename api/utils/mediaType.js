const normalizeMediaTypeKey = (value) => String(value || '').trim().toLowerCase()

const getMediaTypeKey = (mediaType) => normalizeMediaTypeKey(mediaType?.type || mediaType)

const isVideoMediaType = (mediaType) => getMediaTypeKey(mediaType) === 'video'

const isImageMediaType = (mediaType) => getMediaTypeKey(mediaType) === 'image'

const isManagedMediaType = (mediaType) => {
  const key = getMediaTypeKey(mediaType)
  return key === 'video' || key === 'image'
}

const getMediaDeleteAssetFolder = (mediaType) => {
  const key = getMediaTypeKey(mediaType)
  if (key === 'video') return 'videos'
  if (key === 'image') return 'images'
  return null
}

module.exports = {
  normalizeMediaTypeKey,
  getMediaTypeKey,
  isVideoMediaType,
  isImageMediaType,
  isManagedMediaType,
  getMediaDeleteAssetFolder,
}
