import { defineStore } from 'pinia'
import {getReadableDuration} from '@/services/formatUtils'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    player: null,
    active: false,
    fullscreen: false,
    statusText: '',
    statusIcon: '',
    statusTimeout: -1,
    playlistVisible: false,
    marksVisible: false,
    mouseOverControls: false,
    isControlsVisible: true,
    keyboardBlockers: {},

    duration: 1,
    volume: 1,
    speed: 1,
    muted: false,
    paused: false,
    currentTime: 0,
    currentTimeTimeout: -1,
    seekTime: 0,
    seeking: false,
    playbackError: null,
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
        if (this.player) this.currentTime = this.player.currentTime
      }, timeout)
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
      if (this.player) this.player.currentTime = 0
      this.currentTime = 0
      clearInterval(this.currentTimeTimeout)
    },
    playerJumpTo(time) {
      if (!this.player) return
      if (time < 0) time = 0
      else if (time > this.duration) time = this.duration
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
