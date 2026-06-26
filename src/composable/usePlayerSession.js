import {ref, computed, onMounted, onBeforeUnmount, watch, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import _ from 'lodash'
import path from 'path-browserify'
import {apiClient} from '@/services/apiClient'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useDialogsStore} from '@/stores/dialogs'
import {useRegistrationStore} from '@/stores/registration'
import {useEventBus} from '@/utils/eventBus'
import {buildMarkPayload} from '@/utils/markAdding'
import {isWinElectronUi} from '@/utils/debugWinElectronUi'
import {usePlayerHotkeys} from '@/composable/usePlayerHotkeys'
import {usePlayerWindowBridge} from '@/composable/usePlayerWindowBridge'
import {usePlayerPlayback} from '@/composable/usePlayerPlayback'
import {handlePlayerVideoWheel} from '@/utils/playerHotkeys'
import {setNotification} from '@/services/notificationService'
import {openPath as openFilePath} from '@/services/shellService'

export const PLAYER_SESSION_KEY = Symbol('playerSession')

export function usePlayerSession() {
  const appStore = useAppStore()
  const playerStore = usePlayerStore()
  const dialogsStore = useDialogsStore()
  const registrationStore = useRegistrationStore()
  const eventBus = useEventBus()
  const {t} = useI18n()

  const {
    isPlayerWindow,
    updateItemVideo,
    updatePlayerWindowTitle,
    resetPlayerWindowTitle,
    exitElectronFullscreenIfNeeded,
    attach: attachPlayerWindowBridge,
    detach: detachPlayerWindowBridge,
  } = usePlayerWindowBridge({
    onInvalidPlayData: () => {
      setNotification({
        type: 'error',
        title: t('player.error_title'),
        text: t('player.invalid_video_data'),
      })
    },
  })

  const isReady = ref(null)
  const videoPlayer = ref(null)
  const controls = ref(null)
  const marks = ref(null)
  const timeoutControls = ref(-1)

  const {
    bindVideoElement,
    getMarks,
    loadSrc,
    updatePlaybackTime,
    initPlayingVideo,
  } = usePlayerPlayback({
    isReady,
    videoPlayer,
    controls,
    marks,
    isPlayerWindow,
    updateItemVideo,
    updatePlayerWindowTitle,
  })

  const player = computed(() => playerStore)
  const isActive = computed(() => isPlayerWindow.value || playerStore.active)
  const playerDialogClass = computed(() => {
    if (!isPlayerWindow.value) return 'dialog-player'
    return isWinElectronUi() ? 'player-standalone--win' : ''
  })
  const reg = computed(() => registrationStore.reg)
  const video = computed(() => playerStore.playlist[playerStore.nowPlaying])
  const currentPlaying = computed(() => video.value ? video.value.name : '')
  const isAudioMode = computed(() => playerStore.isAudioMode)
  const audioThumb = computed(() => video.value?.thumb || '/images/unavailable.png')
  const fileExtension = computed(() => {
    if (!video.value?.path) return ''
    const ext = path.extname(video.value.path)
    return ext ? ext.slice(1).toUpperCase() : ''
  })
  const formatErrorMessage = computed(() => {
    return isAudioMode.value
      ? t('player.audio_format_not_supported')
      : t('player.video_format_not_supported')
  })
  const showPlaybackError = computed(() =>
    playerStore.active && isReady.value && playerStore.playbackError
  )

  const closePlayer = async () => {
    if (video.value) {
      await updatePlaybackTime(video.value)
    }

    playerStore.active = false
    playerStore.playbackError = false
    isReady.value = false

    if (playerStore.player) {
      playerStore.player.pause()
      playerStore.player.src = null
    }

    clearInterval(playerStore.currentTimeTimeout)
    playerStore.currentTime = 0
    playerStore.isAudioMode = false
    playerStore.paused = false
    detachHotkeys()

    resetPlayerWindowTitle()
  }

  const playerWrapperProps = computed(() => {
    if (isPlayerWindow.value) {
      return {
        class: ['player-standalone', playerDialogClass.value].filter(Boolean),
      }
    }

    return {
      'onUpdate:modelValue': closePlayer,
      modelValue: isActive.value,
      persistent: false,
      contentClass: playerDialogClass.value,
      width: 2000,
      noClickAnimation: true,
      eager: true,
    }
  })

  const {attach: attachHotkeys, detach: detachHotkeys} = usePlayerHotkeys(() => ({
    playerStore,
    controls: controls.value,
    togglePause,
    toggleFullscreen,
    changeVolume,
    openAddingMark,
    closePlayer,
  }))

  const openPath = () => {
    openFilePath(video.value.path, false)
  }

  const stopSmoothScroll = (event) => {
    if (event.button != 1) return
    event.preventDefault()
    event.stopPropagation()
  }

  const showControls = () => {
    playerStore.isControlsVisible = true
    clearTimeout(timeoutControls.value)
  }

  const toggleFullscreen = async () => {
    showControls()
    controls.value?.resize?.()

    if (playerStore.fullscreen) {
      try {
        screen.orientation.unlock()
        await document.exitFullscreen()
      } catch (e) {
        exitElectronFullscreenIfNeeded()
        console.log(e)
      }
    } else {
      document.getElementById('player').requestFullscreen()
      if (!playerStore.isAudioMode && screen.orientation?.lock) {
        screen.orientation.lock('landscape').catch(() => {})
      }
    }
    playerStore.fullscreen = !playerStore.fullscreen
  }

  const togglePictureInPicture = async () => {
    showControls()
    if (playerStore.fullscreen) {
      await document.exitFullscreen()
      playerStore.fullscreen = false
    }

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else if (document.pictureInPictureEnabled) {
      playerStore.player.requestPictureInPicture()
    }
  }

  const changeVolume = (e) => {
    let volume
    if (e.deltaY !== undefined) {
      volume = (playerStore.player.volume + e.deltaY / 1000 / 2).toFixed(2)
    } else if (e.volume !== undefined) {
      volume = e.volume
    } else {
      return
    }

    if (volume < 0) volume = 0
    if (volume > 1) volume = 1

    playerStore.player.volume = volume
    playerStore.volume = volume

    playerStore.changePlayerStatusText({
      text: (volume * 100).toFixed() + ' %',
      icon: 'volume-high',
    })
  }

  const onVideoWheel = (event) => {
    if (!playerStore.active) return
    handlePlayerVideoWheel(event, {
      controls: controls.value,
      changeVolume,
    })
  }

  const clickOnVideo = (e) => {
    switch (e.button) {
      case 3:
        controls.value?.prev?.()
        break
      case 4:
        controls.value?.next?.()
        break
    }
  }

  const playVideoObject = async (videos) => {
    const {n, o} = videos
    await updatePlaybackTime(o)
    loadSrc(n)
  }

  const togglePause = () => {
    controls.value?.togglePause?.()
  }

  const moveOverPlayer = _.debounce((e) => {
    if (!playerStore.active) return
    if (!e.movementX && !e.movementY) return
    showControls()
    if (!playerStore.fullscreen || playerStore.mouseOverControls) return
    if (playerStore.paused) return

    timeoutControls.value = setTimeout(() => {
      playerStore.isControlsVisible = false
    }, 3000)
  }, 5)

  const openAddingMark = (type) => {
    dialogsStore.openMarkAdding({
      time: playerStore.currentTime,
      type: type || 'favorite',
    })
  }

  const addTagToMedia = async (tagId, metaId) => {
    const response = await apiClient.post('/api/TagsInMedia/createOne', {
      mediaId: video.value.id,
      tagId,
      metaId: metaId || appStore.getTagById(tagId)?.metaId,
    })

    if (response.data?.[1]) {
      setNotification({
        title: t('player.tag_added_to_video'),
        type: 'success',
        icon: 'tag',
      })
    }

    updateItemVideo(video.value.id)
  }

  const addMark = async (data = {}) => {
    if (!video.value?.id) return

    const adding = dialogsStore.markAdding
    dialogsStore.setMarkAddingSubmitting(true)

    const mark = buildMarkPayload({
      adding,
      data,
      mediaId: video.value.id,
    })

    try {
      await apiClient.post('/api/mark', mark)

      if (mark.tagId) {
        await addTagToMedia(mark.tagId, adding.meta?.id)
      }

      playerStore.changePlayerStatusText({
        text: t('player.mark_added'),
        icon: 'tooltip-plus',
      })

      await getMarks(video.value)
      dialogsStore.closeMarkAdding()
    } catch (e) {
      console.error(e)
      setNotification({
        type: 'error',
        title: t('player.mark_dialog.add_failed'),
        text: e?.response?.data?.message || e?.message,
      })
    } finally {
      dialogsStore.setMarkAddingSubmitting(false)
    }
  }

  const removeMark = async (mark) => {
    try {
      await apiClient.delete(`/api/mark/${mark.id}`)
      await getMarks(video.value)
    } catch (e) {
      console.log(e)
    }
  }

  const nextVideo = () => {
    controls.value?.next?.()
  }

  const handlePlayVideoEvent = (event) => {
    if (event?.video) {
      const {video: media, videos, time} = event
      initPlayingVideo(media, videos, time)
    }
  }

  const exitHandler = () => {
    if (!document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
      playerStore.fullscreen = false
    }
  }

  onMounted(async () => {
    await nextTick()
    bindVideoElement(videoPlayer.value)

    eventBus.on('playVideo', handlePlayVideoEvent)

    attachPlayerWindowBridge({
      onPlayVideo: initPlayingVideo,
      onStopPlaying: closePlayer,
    })

    if (document.addEventListener) {
      document.addEventListener('fullscreenchange', exitHandler, false)
      document.addEventListener('mozfullscreenchange', exitHandler, false)
      document.addEventListener('MSFullscreenChange', exitHandler, false)
      document.addEventListener('webkitfullscreenchange', exitHandler, false)
    }
  })

  onBeforeUnmount(() => {
    eventBus.off('playVideo', handlePlayVideoEvent)
    detachPlayerWindowBridge()
    clearTimeout(timeoutControls.value)
    document.removeEventListener('fullscreenchange', exitHandler)
    document.removeEventListener('mozfullscreenchange', exitHandler)
    document.removeEventListener('MSFullscreenChange', exitHandler)
    document.removeEventListener('webkitfullscreenchange', exitHandler)
  })

  watch(() => playerStore.active, (active) => {
    if (active) attachHotkeys()
    else detachHotkeys()
  }, {immediate: true})

  watch(() => playerStore.volume, (newValue, oldValue) => {
    if (newValue !== oldValue && playerStore.player) {
      playerStore.player.volume = newValue
    }
  })

  return {
    player,
    playerStore,
    dialogsStore,
    isPlayerWindow,
    isActive,
    playerWrapperProps,
    reg,
    videoPlayer,
    bindVideoElement,
    controls,
    marks,
    currentPlaying,
    isAudioMode,
    audioThumb,
    fileExtension,
    formatErrorMessage,
    showPlaybackError,
    closePlayer,
    stopSmoothScroll,
    moveOverPlayer,
    togglePause,
    toggleFullscreen,
    togglePictureInPicture,
    onVideoWheel,
    clickOnVideo,
    playVideoObject,
    changeVolume,
    showControls,
    openAddingMark,
    addMark,
    removeMark,
    openPath,
    nextVideo,
    updateItemVideo,
  }
}
