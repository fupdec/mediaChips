const MEDIA_TYPE_KEYS = {
  video: 'video',
  videos: 'video',
  movie: 'video',
  movies: 'video',
  image: 'image',
  images: 'image',
  photo: 'image',
  photos: 'image',
  audio: 'audio',
  audios: 'audio',
  music: 'audio',
  text: 'text',
  texts: 'text',
  book: 'book',
  books: 'book',
  document: 'document',
  documents: 'document',
}

export const getMediaTypeName = (mediaType, t) => {
  const fallback = mediaType?.name || ''
  const source = mediaType?.type || mediaType?.name || ''
  const key = MEDIA_TYPE_KEYS[source.toString().trim().toLowerCase()]

  return key ? t(`media.type_names.${key}`, fallback) : fallback
}
