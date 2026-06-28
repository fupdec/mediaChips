import type { PlayerMark } from '@/types/player'

export const BASE_MARK_TYPES = [
  { value: 'favorite', textKey: 'meta.default_names.favorite', icon: 'heart', color: '#e91e63' },
  { value: 'bookmark', textKey: 'meta.default_names.bookmark', icon: 'bookmark', color: '#f44336' },
] as const

export const isMetaMarkType = (type: string): boolean => type !== 'favorite' && type !== 'bookmark'

interface AssignedMetaItem {
  meta?: { id?: number; name?: string; icon?: string; marks?: boolean }
  metaId?: number
}

export function buildMarkTypes(assigned: AssignedMetaItem[] = []) {
  const pinned = assigned
    .filter((item) => item.meta?.marks)
    .map((item) => ({
      value: item.meta!.id,
      text: item.meta!.name,
      icon: item.meta!.icon || 'tag',
    }))

  return [...BASE_MARK_TYPES, ...pinned]
}

export function findAssignedMeta(assigned: AssignedMetaItem[] | null | undefined, type: unknown) {
  const metaId = Number(type)
  return (assigned || []).find(
    (item) => Number(item.metaId ?? item.meta?.id) === metaId,
  )
}

export function normalizeMarkTime(value: unknown, fallback = 0): number {
  const time = Math.floor(Number(value))
  if (!Number.isFinite(time)) return fallback
  return Math.max(0, time)
}

interface MarkAddingState {
  time: unknown
  is_end_time_active?: boolean
  end?: unknown
  type: string
}

export function buildMarkPayload({
  adding,
  data = {},
  mediaId,
}: {
  adding: MarkAddingState
  data?: Record<string, unknown>
  mediaId: number | string
}): PlayerMark & Record<string, unknown> {
  const time = normalizeMarkTime(adding.time)
  const hasEnd = adding.is_end_time_active && adding.end != null
  const end = hasEnd ? Math.max(time, normalizeMarkTime(adding.end, time)) : null
  const tagId = data.tagId != null
    ? (Array.isArray(data.tagId) ? data.tagId[0] : data.tagId)
    : null

  const mark: PlayerMark & Record<string, unknown> = {
    type: tagId ? 'meta' : adding.type,
    time,
    end: end ?? undefined,
    mediaId,
    ...data,
  }

  if (tagId) {
    mark.type = 'meta'
    mark.tagId = tagId
  }

  return mark
}
