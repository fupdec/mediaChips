type MediaTypeLike = string | {type?: string | null} | null | undefined

const normalizeMediaTypeKey = (value: unknown) => String(value || '').trim().toLowerCase()

const getMediaTypeKey = (mediaType: MediaTypeLike) => normalizeMediaTypeKey(
  typeof mediaType === 'object' && mediaType !== null ? mediaType.type : mediaType,
)

const isVideoMediaType = (mediaType: MediaTypeLike) => getMediaTypeKey(mediaType) === 'video'

const isImageMediaType = (mediaType: MediaTypeLike) => getMediaTypeKey(mediaType) === 'image'

const isAudioMediaType = (mediaType: MediaTypeLike) => getMediaTypeKey(mediaType) === 'audio'

const isTextMediaType = (mediaType: MediaTypeLike) => getMediaTypeKey(mediaType) === 'text'

const isManagedMediaType = (mediaType: MediaTypeLike) => {
  const key = getMediaTypeKey(mediaType)
  return key === 'video' || key === 'image' || key === 'audio' || key === 'text'
}

const getMediaDeleteAssetFolder = (mediaType: MediaTypeLike) => {
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
