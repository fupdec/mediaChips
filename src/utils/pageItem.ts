import type { MediaItem } from '@shared/entities/media'
import type { Tag } from '@shared/entities/meta'

export type PageItem = MediaItem | Tag

export function isMediaPageItem(
  item: PageItem,
  type: 'media' | 'tag' | string,
): item is MediaItem {
  return type === 'media'
}

export function isTagPageItem(
  item: PageItem,
  type: 'media' | 'tag' | string,
): item is Tag {
  return type === 'tag'
}

export function mediaPageItemPath(item: PageItem, type: 'media' | 'tag' | string): string {
  return isMediaPageItem(item, type) ? String(item.path ?? '') : ''
}
