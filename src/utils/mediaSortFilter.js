import Cols from '../../app/configs/filter-cols.mjs'
import {
  getMediaTypeKey,
  isImageMediaType,
  isVideoMediaType,
  matchesMediaTypeFilter,
} from '@/utils/mediaType'

export const VIDEO_ONLY_FILTER_PARAMS = ['duration', 'bitrate', 'fps', 'codec']

export const MEDIA_SORT_PARAMS = [
  {param: 'path', icon: 'folder', textKey: 'filters.sort.path', types: ['media']},
  {
    param: 'name',
    icon: 'alphabetical-variant',
    textKey: 'filters.sort.name',
    types: ['media', 'tag'],
  },
  {param: 'rating', icon: 'star', textKey: 'filters.sort.rating', types: ['media', 'tag']},
  {
    param: 'createdAt',
    icon: 'calendar-plus',
    textKey: 'filters.sort.date_added',
    types: ['media', 'tag'],
  },
  {
    param: 'updatedAt',
    icon: 'calendar-edit',
    textKey: 'filters.sort.date_updated',
    types: ['media', 'tag'],
  },
  {
    param: 'viewedAt',
    icon: 'calendar-cursor',
    textKey: 'filters.sort.viewed_date',
    types: ['media', 'tag'],
  },
  {
    param: 'views',
    icon: 'eye',
    textKey: 'filters.sort.views',
    types: ['media', 'tag'],
  },
  {param: 'filesize', icon: 'harddisk', textKey: 'filters.sort.filesize', types: ['media']},
  {
    param: 'duration',
    icon: 'clock-outline',
    textKey: 'filters.sort.duration',
    types: ['media'],
    media_types: ['video'],
  },
  {
    param: 'bitrate',
    icon: 'filmstrip',
    textKey: 'filters.sort.bitrate',
    types: ['media'],
    media_types: ['video'],
  },
  {
    param: 'fps',
    icon: 'filmstrip',
    textKey: 'filters.sort.framerate',
    types: ['media'],
    media_types: ['video'],
  },
  {
    param: 'codec',
    icon: 'filmstrip',
    textKey: 'filters.sort.codec',
    types: ['media'],
    media_types: ['video'],
  },
  {
    param: 'width',
    icon: 'monitor-screenshot',
    textKey: 'filters.sort.width',
    types: ['media'],
    media_types: ['video', 'image'],
  },
  {
    param: 'height',
    icon: 'monitor-screenshot',
    textKey: 'filters.sort.height',
    types: ['media'],
    media_types: ['video', 'image'],
  },
  {
    param: 'shuffle',
    icon: 'shuffle-variant',
    textKey: 'filters.sort.shuffle',
    types: ['media', 'tag'],
  },
]

export function getSortParams(itemsType, mediaType) {
  return MEDIA_SORT_PARAMS.filter((param) =>
    param.types.includes(itemsType) &&
    matchesMediaTypeFilter(param, mediaType)
  )
}

export function normalizeSortBy(sortBy, itemsType, mediaType, fallback = 'createdAt') {
  if (sortBy === 'shuffle') return sortBy

  const allowed = getSortParams(itemsType, mediaType).map((param) => param.param)
  return allowed.includes(sortBy) ? sortBy : fallback
}

export function getAllowedFilterParams(itemsType, mediaType) {
  const params = new Set()

  for (const item of Cols.standart || []) {
    params.add(item.param)
  }

  if (itemsType === 'media') {
    for (const item of Cols.media || []) {
      params.add(item.param)
    }
    if (isVideoMediaType(mediaType)) {
      for (const item of Cols.video || []) {
        params.add(item.param)
      }
    }
    if (isImageMediaType(mediaType)) {
      for (const item of Cols.image || []) {
        params.add(item.param)
      }
    }
  } else if (itemsType === 'tag') {
    for (const item of Cols.metaTag || []) {
      params.add(item.param)
    }
  }

  return params
}

export function isFilterParamAllowed(param, itemsType, mediaType) {
  if (typeof param === 'number') return true
  return getAllowedFilterParams(itemsType, mediaType).has(param)
}

export function sanitizeFiltersForMediaType(filters, itemsType, mediaType) {
  return filters.map((filter) => {
    if (filter.lock) return filter
    if (!isFilterParamAllowed(filter.param, itemsType, mediaType)) {
      return {...filter, active: false}
    }
    return filter
  })
}

export function getDuplicatesGroupKey(mediaType) {
  return isImageMediaType(mediaType) ? 'path' : 'filesize'
}

export function getDuplicatesModeLabelKey(mediaType) {
  return isImageMediaType(mediaType)
    ? 'filters.show_only_duplicates_by_path'
    : 'filters.show_only_duplicates_by_filesize'
}

export function getMediaTypeKeyFromId(mediaTypes, mediaTypeId) {
  const mediaType = mediaTypes?.find((item) => item.id === Number(mediaTypeId))
  return getMediaTypeKey(mediaType)
}
