import type { MediaItem, Playlist } from '@/types/stores'

export interface PagePlaylist extends Playlist {
  name: string
  media?: MediaItem[]
  count?: number | null
  countLoading?: boolean
  previewIds?: number[]
  thumbs?: string[]
}
