const normalizeMediaTypeKey = (value) => String(value || '').trim().toLowerCase()

const getMediaTypeKey = (mediaType) => normalizeMediaTypeKey(mediaType?.type || mediaType)

const isVideoMediaType = (mediaType) => getMediaTypeKey(mediaType) === 'video'

const isImageMediaType = (mediaType) => getMediaTypeKey(mediaType) === 'image'

const isAudioMediaType = (mediaType) => getMediaTypeKey(mediaType) === 'audio'

const isManagedMediaType = (mediaType) => {
  const key = getMediaTypeKey(mediaType)
  return key === 'video' || key === 'image' || key === 'audio'
}

const getMediaDeleteAssetFolder = (mediaType) => {
  const key = getMediaTypeKey(mediaType)
  if (key === 'video') return 'videos'
  if (key === 'image') return 'images'
  if (key === 'audio') return 'audios'
  return null
}

module.exports = {
  normalizeMediaTypeKey,
  getMediaTypeKey,
  isVideoMediaType,
  isImageMediaType,
  isAudioMediaType,
  isManagedMediaType,
  getMediaDeleteAssetFolder,
}
