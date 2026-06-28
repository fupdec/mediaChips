import type { ComputedRef, Ref } from 'vue'
import type { MediaItem } from './stores'

export interface PlayerMark {
  id?: number
  type: string
  time: number
  end?: number
  meta?: { id?: number; icon?: string }
  metaId?: number
  'tag.icon'?: string
  'tag.color'?: string
  tag?: { color?: string }
  [key: string]: unknown
}

export type MarkDisplayVariant = 'list' | 'timeline'

export interface PlayerControlsRef {
  resize?: () => void
  togglePause?: () => void
  prev?: () => void
  next?: () => void
  [key: string]: unknown
}

export interface PlayerMarksComponentRef {
  getThumbs?: () => Promise<void>
  [key: string]: unknown
}

export interface UsePlayerPlaybackOptions {
  isReady: Ref<boolean | null>
  videoPlayer: Ref<HTMLVideoElement | null>
  controls: Ref<PlayerControlsRef | null>
  marks: Ref<PlayerMarksComponentRef | null>
  isPlayerWindow: ComputedRef<boolean>
  updateItemVideo: (id: number | string) => void
  updatePlayerWindowTitle: (item: MediaItem) => void
}

export interface PlayVideoSwitch {
  n: MediaItem
  o: MediaItem
}

export interface ResolvedPlayableVideo {
  video: MediaItem
  index: number
}

export interface UsePlayerWindowBridgeOptions {
  onInvalidPlayData?: () => void
}

export interface PlayerWindowBridgeAttachOptions {
  onPlayVideo: (
    media: MediaItem,
    videos: MediaItem[],
    time?: number,
  ) => void | Promise<void>
  onStopPlaying: () => void | Promise<void>
}

export interface PlayerSessionInject {
  changeLiveTranscodeMaxHeight?: (maxHeight: number | string) => Promise<void>
}
