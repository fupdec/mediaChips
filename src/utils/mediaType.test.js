import {describe, it, expect} from 'vitest'
import {
  MEDIA_TYPE_VIDEO,
  MEDIA_TYPE_AUDIO,
  normalizeMediaTypeKey,
  getMediaTypeKey,
  isVideoMediaType,
  isAudioMediaType,
  isAudioFilePath,
  findMediaTypeById,
  getDefaultMediaTypeId,
  getMediaDeleteAssetFolder,
  mediaTypeMatches,
  matchesMediaTypeFilter,
  getMenuOrderedMediaTypes,
  sortByMenuMediaTypeOrder,
} from '@/utils/mediaType'

const sampleMediaTypes = [
  {id: 1, type: 'image', name: 'Images', order: 2},
  {id: 2, type: 'video', name: 'Videos', order: 0},
  {id: 3, type: 'audio', name: 'Audio', order: 1, hidden: true},
]

describe('mediaType', () => {
  it('normalizes media type keys', () => {
    expect(normalizeMediaTypeKey(' Video ')).toBe('video')
    expect(getMediaTypeKey({type: 'Audio'})).toBe('audio')
    expect(getMediaTypeKey({name: 'Video'})).toBe('video')
  })

  it('detects media type categories', () => {
    expect(isVideoMediaType({type: 'video'})).toBe(true)
    expect(isAudioMediaType({type: 'audio'})).toBe(true)
    expect(isVideoMediaType({type: 'audio'})).toBe(false)
  })

  it('detects audio file extensions', () => {
    expect(isAudioFilePath('/music/track.flac')).toBe(true)
    expect(isAudioFilePath('/clips/movie.mp4')).toBe(false)
    expect(isAudioFilePath(null)).toBe(false)
  })

  it('finds media type by id', () => {
    expect(findMediaTypeById(sampleMediaTypes, '2')).toEqual(sampleMediaTypes[1])
    expect(findMediaTypeById(sampleMediaTypes, 99)).toBeNull()
    expect(findMediaTypeById(null, 1)).toBeNull()
  })

  it('returns default video media type id', () => {
    expect(getDefaultMediaTypeId(sampleMediaTypes)).toBe(2)
    expect(getDefaultMediaTypeId([{id: 5, type: 'image'}])).toBe(5)
    expect(getDefaultMediaTypeId([])).toBeNull()
  })

  it('maps delete asset folders', () => {
    expect(getMediaDeleteAssetFolder({type: MEDIA_TYPE_VIDEO})).toBe('videos')
    expect(getMediaDeleteAssetFolder({type: MEDIA_TYPE_AUDIO})).toBe('audios')
    expect(getMediaDeleteAssetFolder({type: 'unknown'})).toBeNull()
  })

  it('matches allowed media types', () => {
    const video = {type: 'video'}
    expect(mediaTypeMatches(video, ['video', 'audio'])).toBe(true)
    expect(mediaTypeMatches(video, ['audio'])).toBe(false)
    expect(mediaTypeMatches(video, [])).toBe(true)
  })

  it('matches media type filters', () => {
    const video = {id: 2, type: 'video'}

    expect(matchesMediaTypeFilter({media_types: ['video']}, video)).toBe(true)
    expect(matchesMediaTypeFilter({media_types: ['audio']}, video)).toBe(false)
    expect(matchesMediaTypeFilter({media_type_id: [2]}, video)).toBe(true)
    expect(matchesMediaTypeFilter({media_type_id: [1]}, video)).toBe(false)
    expect(matchesMediaTypeFilter({}, video)).toBe(true)
  })

  it('orders visible media types for menus', () => {
    expect(getMenuOrderedMediaTypes(sampleMediaTypes).map(item => item.id)).toEqual([2, 1])
  })

  it('sorts items by menu media type order', () => {
    const items = [
      {id: 'a', mediaTypeId: 1},
      {id: 'b', mediaTypeId: 2},
    ]

    expect(sortByMenuMediaTypeOrder(items, sampleMediaTypes).map(item => item.id)).toEqual(['b', 'a'])
  })
})
