import { defineStore } from 'pinia'
import {getReadableDuration} from '@/services/formatUtils'
import {
  getAbsoluteBufferedRanges,
  getAbsolutePlaybackTime,
} from '@/utils/playerBuffer'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    player: null,
    active: false,
    fullscreen: false,
    statusText: '',
    statusIcon: '',
    backgroundStatusText: '',
    backgroundStatusIcon: '',
    statusTimeout: -1,
    playlistVisible: false,
    marksVisible: false,
    mouseOverControls: false,
    isControlsVisible: true,
    keyboardBlockers: {},

    usesLiveTranscode: false,
    liveTranscodeStarted: false,
    liveTranscodeMediaId: null,
    liveTranscodeMaxHeight: '1080',
    liveStreamSeekHandler: null,
    liveStreamOffset: 0,
    bufferedRanges: [],
    isLiveStreamSeeking: false,
    isStreamWaiting: false,

    duration: 1,
    volume: 1,
    speed: 1,
    muted: false,
    paused: false,
    currentTime: 0,
    currentTimeTimeout: -1,
    seekTime: 0,
    seeking: false,
    playbackError: false,
    transcodeStatus: 'none',
    transcodeError: null,
    timeRemain: false,
    media: null,
    progress_hover: null,
    is_mark_hover: false,
    metadata: {},
    is_file_exists: false,
    isAudioMode: false,

    nowPlaying: 0,
    playlist: [],
    playlistShuffle: [],
    playlistMode: ['autoplay'],

    marks: [],
    mediaWindowTitle: '',
  }),
  getters: {
    isKeyboardBlocked(state) {
      return Object.keys(state.keyboardBlockers).length > 0
    },
    displayStatusText(state) {
      return state.statusText || state.backgroundStatusText
    },
    displayStatusIcon(state) {
      return state.statusIcon || state.backgroundStatusIcon
    },
  },
  actions: {
    setKeyboardBlocked(reason, blocked) {
      if (blocked) {
        this.keyboardBlockers = {...this.keyboardBlockers, [reason]: true}
      } else {
        const next = {...this.keyboardBlockers}
        delete next[reason]
        this.keyboardBlockers = next
      }
    },
    trackCurrentTime() {
      clearInterval(this.currentTimeTimeout)
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
      this.player.play()
      this.paused = false
      this.changePlayerStatusText({ text: 'Play', icon: 'play' })
      this.trackCurrentTime()
    },
    playerPause() {
      if (!this.player) return
      this.player.pause()
      this.paused = true
      this.changePlayerStatusText({ text: 'Paused', icon: 'pause' })
      clearInterval(this.currentTimeTimeout)
    },
    playerStop() {
      if (!this.player) return
      this.player.pause()
      this.paused = true
      this.bufferedRanges = []
      clearInterval(this.currentTimeTimeout)

      if (this.usesLiveTranscode && this.liveStreamSeekHandler) {
        this.currentTime = 0
        this.liveStreamSeekHandler(0)
        return
      }

      this.player.currentTime = 0
      this.currentTime = 0
    },
    playerJumpTo(time) {
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
    changePlayerStatusText({ text, icon }) {
      clearTimeout(this.statusTimeout)
      this.statusText = text
      this.statusIcon = icon
      this.statusTimeout = setTimeout(() => {
        this.statusText = ''
        this.statusIcon = ''
      }, 3000)
    },
    setBackgroundStatus({ text, icon }) {
      this.backgroundStatusText = text
      this.backgroundStatusIcon = icon
    },
    clearBackgroundStatus() {
      this.backgroundStatusText = ''
      this.backgroundStatusIcon = ''
    },
    setPlaylistItems(videos, {host = ''} = {}) {
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
  }
})

export default usePlayerStore
