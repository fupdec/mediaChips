import { defineStore } from 'pinia'
import { getReadableDuration } from '@/services/formatUtils'
import {
  getAbsoluteBufferedRanges,
  getAbsolutePlaybackTime,
} from '@/utils/playerBuffer'
import type { MediaItem, PlayerPlaylistItem } from '@/types/stores'
import type { PlayerMark } from '@/types/player'

type TimeoutHandle = ReturnType<typeof setTimeout>
type IntervalHandle = ReturnType<typeof setInterval>

export const usePlayerStore = defineStore('player', {
  state: () => ({
    player: null as HTMLVideoElement | null,
    active: false,
    fullscreen: false,
    statusText: '',
    statusIcon: '',
    backgroundStatusText: '',
    backgroundStatusIcon: '',
    statusTimeout: -1 as TimeoutHandle | number,
    playlistVisible: false,
    marksVisible: false,
    mouseOverControls: false,
    isControlsVisible: true,
    keyboardBlockers: {} as Record<string, boolean>,

    usesLiveTranscode: false,
    liveTranscodeStarted: false,
    liveTranscodeMediaId: null as number | null,
    liveTranscodeMaxHeight: '1080',
    liveStreamSeekHandler: null as ((time: number) => void) | null,
    liveStreamOffset: 0,
    bufferedRanges: [] as Array<{ start: number; end: number }>,
    isLiveStreamSeeking: false,
    isStreamWaiting: false,

    duration: 1,
    volume: 1,
    speed: 1,
    muted: false,
    paused: false,
    currentTime: 0,
    currentTimeTimeout: -1 as IntervalHandle | number,
    seekTime: 0,
    seeking: false,
    playbackError: false,
    transcodeStatus: 'none' as string,
    transcodeError: null as string | null,
    timeRemain: false,
    media: null as MediaItem | null,
    progress_hover: null as number | null,
    is_mark_hover: false,
    metadata: {} as Record<string, unknown>,
    is_file_exists: false,
    isAudioMode: false,

    nowPlaying: 0,
    playlist: [] as PlayerPlaylistItem[],
    playlistShuffle: [] as number[],
    playlistMode: ['autoplay'] as string[],

    marks: [] as PlayerMark[],
    mediaWindowTitle: '',
  }),
  getters: {
    isKeyboardBlocked(state): boolean {
      return Object.keys(state.keyboardBlockers).length > 0
    },
    displayStatusText(state): string {
      return state.statusText || state.backgroundStatusText
    },
    displayStatusIcon(state): string {
      return state.statusIcon || state.backgroundStatusIcon
    },
  },
  actions: {
    setKeyboardBlocked(reason: string, blocked: boolean) {
      if (blocked) {
        this.keyboardBlockers = { ...this.keyboardBlockers, [reason]: true }
      } else {
        const next = { ...this.keyboardBlockers }
        delete next[reason]
        this.keyboardBlockers = next
      }
    },
    trackCurrentTime() {
      clearInterval(this.currentTimeTimeout as IntervalHandle)
      let timeout = 100
      if (this.duration > 200) timeout = 1000
      this.currentTimeTimeout = setInterval(() => {
        this.syncPlaybackState()
      }, timeout)
    },
    syncPlaybackState() {
      if (!this.player) return

      this.currentTime = getAbsolutePlaybackTime({
        usesLiveTranscode: this.usesLiveTranscode,
        liveStreamOffset: this.liveStreamOffset,
        playerCurrentTime: this.player.currentTime,
      })

      this.bufferedRanges = getAbsoluteBufferedRanges(
        this.player,
        this.usesLiveTranscode ? this.liveStreamOffset : 0,
      )
    },
    playerPlay() {
      if (!this.player) return
      void this.player.play()
      this.paused = false
      this.changePlayerStatusText({ text: 'Play', icon: 'play' })
      this.trackCurrentTime()
    },
    playerPause() {
      if (!this.player) return
      this.player.pause()
      this.paused = true
      this.changePlayerStatusText({ text: 'Paused', icon: 'pause' })
      clearInterval(this.currentTimeTimeout as IntervalHandle)
    },
    playerStop() {
      if (!this.player) return
      this.player.pause()
      this.paused = true
      this.bufferedRanges = []
      clearInterval(this.currentTimeTimeout as IntervalHandle)

      if (this.usesLiveTranscode && this.liveStreamSeekHandler) {
        this.currentTime = 0
        this.liveStreamSeekHandler(0)
        return
      }

      this.player.currentTime = 0
      this.currentTime = 0
    },
    playerJumpTo(time: number) {
      if (!this.player) return
      if (time < 0) time = 0
      else if (time > this.duration) time = this.duration

      if (this.usesLiveTranscode && this.liveStreamSeekHandler) {
        this.liveStreamSeekHandler(time)
        return
      }

      this.player.currentTime = time
      this.currentTime = time
      const current = getReadableDuration(time)
      const duration = getReadableDuration(this.duration)
      this.changePlayerStatusText({ text: `${current} / ${duration}`, icon: 'arrow-u-down-right' })
    },
    changePlayerStatusText({ text, icon }: { text: string; icon: string }) {
      clearTimeout(this.statusTimeout as TimeoutHandle)
      this.statusText = text
      this.statusIcon = icon
      this.statusTimeout = setTimeout(() => {
        this.statusText = ''
        this.statusIcon = ''
      }, 3000)
    },
    setBackgroundStatus({ text, icon }: { text: string; icon: string }) {
      this.backgroundStatusText = text
      this.backgroundStatusIcon = icon
    },
    clearBackgroundStatus() {
      this.backgroundStatusText = ''
      this.backgroundStatusIcon = ''
    },
    setPlaylistItems(videos: MediaItem[] | null | undefined, { host = '' }: { host?: string } = {}) {
      const currentId = this.playlist[this.nowPlaying]?.id
      this.playlist = (videos || []).map((item) => ({
        ...item,
        key: String(item.id),
        thumb: item.thumb?.startsWith?.('http')
          ? item.thumb
          : (item.thumb ? `${host}${item.thumb}` : '/images/unavailable.png'),
      }))

      if (currentId != null) {
        const nextIndex = this.playlist.findIndex((item) => item.id === currentId)
        if (nextIndex >= 0) this.nowPlaying = nextIndex
      }
    },
  },
})

export default usePlayerStore
