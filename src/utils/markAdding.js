export const BASE_MARK_TYPES = [
  {value: 'favorite', textKey: 'meta.default_names.favorite', icon: 'heart', color: '#e91e63'},
  {value: 'bookmark', textKey: 'meta.default_names.bookmark', icon: 'bookmark', color: '#f44336'},
]

export const isMetaMarkType = (type) => type !== 'favorite' && type !== 'bookmark'

export function buildMarkTypes(assigned = []) {
  const pinned = assigned
    .filter((item) => item.meta?.marks)
    .map((item) => ({
      value: item.meta.id,
      text: item.meta.name,
      icon: item.meta.icon || 'tag',
    }))

  return [...BASE_MARK_TYPES, ...pinned]
}

export function findAssignedMeta(assigned, type) {
  const metaId = Number(type)
  return (assigned || []).find(
    (item) => Number(item.metaId ?? item.meta?.id) === metaId
  )
}

export function normalizeMarkTime(value, fallback = 0) {
  const time = Math.floor(Number(value))
  if (!Number.isFinite(time)) return fallback
  return Math.max(0, time)
}

export function buildMarkPayload({adding, data = {}, mediaId}) {
  const time = normalizeMarkTime(adding.time)
  const hasEnd = adding.is_end_time_active && adding.end != null
  const end = hasEnd ? Math.max(time, normalizeMarkTime(adding.end, time)) : null
  const tagId = data.tagId != null
    ? (Array.isArray(data.tagId) ? data.tagId[0] : data.tagId)
    : null

  const mark = {
    type: tagId ? 'meta' : adding.type,
    time,
    end,
    mediaId,
    ...data,
  }

  if (tagId) {
    mark.type = 'meta'
    mark.tagId = tagId
  }

  return mark
}
