const normalizeMediaTypeKey = (value) => String(value || '').trim().toLowerCase()

const getMediaTypeKey = (mediaType) => normalizeMediaTypeKey(mediaType?.type || mediaType)

const isVideoMediaType = (mediaType) => getMediaTypeKey(mediaType) === 'video'

const isImageMediaType = (mediaType) => getMediaTypeKey(mediaType) === 'image'

const isAudioMediaType = (mediaType) => getMediaTypeKey(mediaType) === 'audio'

const isTextMediaType = (mediaType) => getMediaTypeKey(mediaType) === 'text'

const isManagedMediaType = (mediaType) => {
  const key = getMediaTypeKey(mediaType)
  return key === 'video' || key === 'image' || key === 'audio' || key === 'text'
}

const getMediaDeleteAssetFolder = (mediaType) => {
  const key = getMediaTypeKey(mediaType)
  if (key === 'video') return 'videos'
  if (key === 'image') return 'images'
  if (key === 'audio') return 'audios'
  if (key === 'text') return 'texts'
  return null
}

module.exports = {
  normalizeMediaTypeKey,
  getMediaTypeKey,
  isVideoMediaType,
  isImageMediaType,
  isAudioMediaType,
  isTextMediaType,
  isManagedMediaType,
  getMediaDeleteAssetFolder,
}
