import type { MediaItem, PlayableMedia } from '@shared/entities/media'

export function toPlayableMediaItem(
  item?: { id?: number; path?: string; name?: string; basename?: string } | null,
): PlayableMedia | null {
  if (item?.id == null) return null
  return {
    id: Number(item.id),
    path: item.path,
    name: item.name ?? item.basename,
  }
}

export function ensureMediaItem(item: PlayableMedia): MediaItem {
  return {
    id: item.id,
    path: item.path,
    name: item.name,
    mediaTypeId: item.mediaTypeId,
    duration: item.duration,
    thumb: item.thumb,
    time: item.time,
  }
}
