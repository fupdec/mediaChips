import {ref, computed, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRoute} from 'vue-router'
import {useDisplay} from 'vuetify'
import axios from 'axios'
import _ from 'lodash'
import path from 'path-browserify'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useDialogsStore} from '@/stores/dialogs'
import {useItemsStore} from '@/stores/items'
import {useEventBus} from '@/utils/eventBus'
import {getDefaultMediaTypeId} from '@/utils/mediaType'
import {isStandalonePlayerRoute} from '@/utils/playerWindow'
import {
  getVolumeDeltaFromWheel,
  preventWheelDefault,
} from '@/utils/playerWheel'

export function usePlayerTransport({emit, jumpToMark}) {
  const appStore = useAppStore()
  const playerStore = usePlayerStore()
  const dialogsStore = useDialogsStore()
  const itemsStore = useItemsStore()
  const eventBus = useEventBus()
  const route = useRoute()
  const {xs, xl, mdAndDown, smAndDown} = useDisplay()
  const {t} = useI18n()

  const editingComponent = ref(null)
  const speeds = ref([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2])
  const video_editing = ref(null)
  const dialog_video_edit = ref(false)

  const player = computed(() => playerStore)
  const apiUrl = computed(() => appStore.localhost)
  const is_separate_window = computed(() => isStandalonePlayerRoute(route))
  const video = computed(() => player.value.playlist[player.value.nowPlaying])
  const isAudioMode = computed(() => playerStore.isAudioMode)

  const density = computed(() => {
    if (smAndDown.value) return 'compact'
    if (mdAndDown.value) return 'comfortable'
    return 'default'
  })

  const isPrevDisabled = computed(() => {
    if (player.value.playlistMode.includes('shuffle')) {
      const shuffleIndex = player.value.playlistShuffle.indexOf(player.value.nowPlaying)
      return shuffleIndex === 0 && !player.value.playlistMode.includes('loop')
    }
    return player.value.nowPlaying === 0 && !player.value.playlistMode.includes('loop')
  })

  const isNextDisabled = computed(() => {
    if (player.value.playlistMode.includes('shuffle')) {
      const shuffleIndex = player.value.playlistShuffle.indexOf(player.value.nowPlaying)
      return (
        shuffleIndex + 1 >= player.value.playlist.length &&
        !player.value.playlistMode.includes('loop')
      )
    }
    return (
      player.value.nowPlaying + 1 >= player.value.playlist.length &&
      !player.value.playlistMode.includes('loop')
    )
  })

  const volumeIcon = computed(() => {
    if (player.value.muted) return 'volume-mute'
    if (player.value.volume > 0.7) return 'volume-high'
    if (player.value.volume > 0.3) return 'volume-medium'
    return 'volume-low'
  })

  const msToTime = (time) => $readable.getReadableDuration(time)

  const play = () => {
    emit('showControls')
    playerStore.playerPlay()
  }

  const pause = () => {
    emit('showControls')
    playerStore.playerPause()
  }

  const stop = () => {
    emit('showControls')
    playerStore.playerStop()
  }

  const togglePause = () => {
    emit('showControls')
    player.value.paused ? play() : pause()
  }

  const prev = async () => {
    if (isPrevDisabled.value) return
    playerStore.paused = false
    const isLoopMode = player.value.playlistMode.includes('loop')
    const current = video.value

    if (player.value.playlistMode.includes('shuffle')) {
      let shuffleIndex = player.value.playlistShuffle.indexOf(player.value.nowPlaying)
      shuffleIndex -= 1
      if (isLoopMode && shuffleIndex < 0) {
        shuffleIndex = player.value.playlist.length - 1
      }
      playerStore.nowPlaying = player.value.playlistShuffle[shuffleIndex]
    } else {
      playerStore.nowPlaying = player.value.nowPlaying - 1
      if (isLoopMode && player.value.nowPlaying < 0) {
        playerStore.nowPlaying = player.value.playlist.length - 1
      }
    }

    emit('play', {n: video.value, o: current})
    if (player.value.playlistVisible) {
      eventBus.emit('scrollToNowPlaying')
    }
  }

  const next = async () => {
    if (isNextDisabled.value) return
    playerStore.paused = false
    const isLoopMode = player.value.playlistMode.includes('loop')
    const current = video.value

    if (player.value.playlistMode.includes('shuffle')) {
      let shuffleIndex = player.value.playlistShuffle.indexOf(player.value.nowPlaying)
      shuffleIndex += 1
      if (isLoopMode && shuffleIndex === player.value.playlist.length) {
        shuffleIndex = 0
      }
      playerStore.nowPlaying = player.value.playlistShuffle[shuffleIndex]
    } else {
      playerStore.nowPlaying = player.value.nowPlaying + 1
      if (isLoopMode && player.value.nowPlaying > player.value.playlist.length - 1) {
        playerStore.nowPlaying = 0
      }
    }

    emit('play', {n: video.value, o: current})
    if (player.value.playlistVisible) {
      eventBus.emit('scrollToNowPlaying')
    }
  }

  const togglePlaylist = () => {
    player.value.playlistVisible = !player.value.playlistVisible
    if (!player.value.playlistVisible) return
    eventBus.emit('scrollToNowPlaying')
  }

  const toggleMarks = () => {
    playerStore.marksVisible = !playerStore.marksVisible
  }

  const toggleMute = () => {
    if (!player.value.player) return

    player.value.player.muted = !player.value.player.muted
    playerStore.muted = !player.value.muted
    let text = `${(player.value.volume * 100).toFixed()} %`
    if (player.value.muted) text = 'Muted'
    playerStore.changePlayerStatusText({
      text,
      icon: volumeIcon.value,
    })
  }

  const changeVolume = (e) => {
    emit('changeVolume', e)
  }

  const handleVolumeWheel = (e, {slider = false} = {}) => {
    if (e.altKey) return

    preventWheelDefault(e)
    emit('showControls')

    changeVolume({
      deltaY: getVolumeDeltaFromWheel(e, {slider}),
    })
  }

  const handleVolumeSliderWheel = (e) => {
    handleVolumeWheel(e, {slider: true})
  }

  const changeSpeed = (speed) => {
    playerStore.speed = speed
    if (player.value.player) {
      player.value.player.playbackRate = speed
    }

    playerStore.changePlayerStatusText({
      text: t('player.playback_speed', {
        speed: speed === 1 ? t('common.normal').toLowerCase() : speed,
      }),
      icon: 'play-speed',
    })
  }

  const addMark = () => {
    if (dialogsStore.markAdding.show) {
      if (!dialogsStore.markAdding.submitting) {
        dialogsStore.closeMarkAdding()
      }
      return
    }
    emit('addMark')
  }

  const removeMark = (mark) => {
    emit('removeMark', mark)
  }

  const setAsThumb = async () => {
    if (!video.value) return

    const imgPath = path.join(
      appStore.mediaPath || '',
      'videos/thumbs',
      `${video.value.id}.jpg`
    )

    const time = new Date(player.value.currentTime * 1000)
      .toISOString()
      .substr(11, 8)

    try {
      await $operable.createThumb(time, video.value.path, imgPath, 320, true)
      emit('updateVideo', video.value.id)
      itemsStore.refreshThumb(video.value.id)
      if (is_separate_window.value && window.electronAPI?.send) {
        window.electronAPI.send('updateVideoFrames', video.value.id)
      }
      $operable.setNotification({
        title: t('player.video_thumb_updated'),
        text: video.value.path,
        icon: 'image',
        type: 'success',
      })
    } catch (e) {
      console.log(e)
      $operable.setNotification({
        title: t('player.video_thumb_not_updated'),
        text: e,
        icon: 'image',
        type: 'error',
      })
    }
  }

  const getVideo = async () => {
    if (!video.value) return null

    const query = {
      mediaTypeId: video.value.mediaTypeId || getDefaultMediaTypeId(appStore.mediaTypes),
      filters: [],
      sortBy: 'createdAt',
      direction: 'asc',
      find_duplicates: false,
      ids: [video.value.id],
    }

    try {
      const res = await axios.post(`${apiUrl.value}/api/media/items`, query)
      return res.data.items[0]
    } catch (e) {
      console.log(e)
      return null
    }
  }

  const editVideo = async () => {
    video_editing.value = await getVideo()
    dialog_video_edit.value = true
  }

  const updateVideoInfo = async () => {
    if (!editingComponent.value?.save) return

    await editingComponent.value.save()
    const videoData = await getVideo()

    if (videoData) {
      player.value.playlist[player.value.nowPlaying] = videoData
    }

    dialog_video_edit.value = false
    emit('updateVideo', video.value.id)
  }

  const deleteVideo = async (with_file) => {
    if (!video.value) return

    const video_edit = _.cloneDeep(video.value)

    if (isNextDisabled.value) {
      if (!isPrevDisabled.value) {
        await prev()
      } else {
        emit('close')
      }
    } else if (video.value.id === video_edit.id) {
      await next()
    }

    const index = player.value.playlist.map((item) => item.id).indexOf(video_edit.id)
    if (index > -1) {
      player.value.playlist.splice(index, 1)
    }

    setTimeout(async () => {
      try {
        await axios({
          method: 'post',
          url: `${apiUrl.value}/api/media/deleteOne`,
          data: {
            type: 'videos',
            id: video_edit.id,
            with_file,
            path: video_edit.path,
          },
        })

        if (is_separate_window.value && window.electronAPI) {
          window.electronAPI.send('removeEntitiesFromState', {
            ids: [video_edit.id],
            type: 'media',
          })
        } else {
          eventBus.emit('removeEntitiesFromState', {
            detail: {
              ids: [video_edit.id],
              type: 'media',
            },
          })
        }
      } catch (e) {
        console.log(e)
      }
    }, 1000)
  }

  watch(dialog_video_edit, (value) => {
    playerStore.setKeyboardBlocked('edit', value)
  })

  watch(() => dialogsStore.markAdding.show, (value) => {
    playerStore.setKeyboardBlocked('mark', value)
  })

  return {
    player,
    playerStore,
    dialogsStore,
    editingComponent,
    speeds,
    video_editing,
    dialog_video_edit,
    video,
    isAudioMode,
    density,
    xs,
    xl,
    isPrevDisabled,
    isNextDisabled,
    volumeIcon,
    msToTime,
    togglePause,
    play,
    pause,
    stop,
    prev,
    next,
    togglePlaylist,
    toggleMarks,
    toggleMute,
    changeVolume,
    handleVolumeWheel,
    handleVolumeSliderWheel,
    changeSpeed,
    addMark,
    removeMark,
    setAsThumb,
    editVideo,
    updateVideoInfo,
    deleteVideo,
    jumpToMark,
  }
}
