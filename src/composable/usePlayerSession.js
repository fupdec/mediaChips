import {ref, computed, onMounted, onBeforeUnmount, watch, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRoute} from 'vue-router'
import axios from 'axios'
import _ from 'lodash'
import path from 'path-browserify'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useSettingsStore} from '@/stores/settings'
import {useDialogsStore} from '@/stores/dialogs'
import {useRegistrationStore} from '@/stores/registration'
import {useItemsStore} from '@/stores/items'
import {useEventBus} from '@/utils/eventBus'
import {getDefaultMediaTypeId, findMediaTypeById, isAudioMediaType, isAudioFilePath} from '@/utils/mediaType'
import {buildMarkPayload} from '@/utils/markAdding'
import {isStandalonePlayerRoute, consumePendingPlay, subscribePlayerWindowMessages} from '@/utils/playerWindow'
import {isWinElectronUi} from '@/utils/debugWinElectronUi'
import {usePlayerHotkeys} from '@/composable/usePlayerHotkeys'
import {handlePlayerVideoWheel} from '@/utils/playerHotkeys'

export const PLAYER_SESSION_KEY = Symbol('playerSession')

export function usePlayerSession() {
  const appStore = useAppStore()
  const playerStore = usePlayerStore()
  const settingsStore = useSettingsStore()
  const dialogsStore = useDialogsStore()
  const registrationStore = useRegistrationStore()
  const itemsStore = useItemsStore()
  const eventBus = useEventBus()
  const route = useRoute()
  const {t} = useI18n()

  const isReady = ref(null)
  const videoPlayer = ref(null)
  const controls = ref(null)
  const marks = ref(null)
  const timeoutControls = ref(-1)

  const player = computed(() => playerStore)
  const isPlayerWindow = computed(() =>
    isStandalonePlayerRoute(route, settingsStore.open_player_in_separate_window)
  )
  const isActive = computed(() => isPlayerWindow.value || playerStore.active)
  const playerDialogClass = computed(() => {
    if (!isPlayerWindow.value) return 'dialog-player'
    return isWinElectronUi() ? 'player-standalone--win' : ''
  })
  const reg = computed(() => registrationStore)
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
    playerStore.active && isReady.value && playerStore.playbackError && reg.value
  )
  const apiUrl = computed(() => appStore.localhost)
  const settings = computed(() => settingsStore)

  const buildPlayerWindowTitle = (item) => {
    const base = appStore.app_title || 'MediaChips'
    const fileName = item?.basename || item?.name
    return fileName ? `${base} - ${fileName}` : base
  }

  const updatePlayerWindowTitle = (item) => {
    if (!isPlayerWindow.value) return
    const title = buildPlayerWindowTitle(item)
    playerStore.mediaWindowTitle = title
    document.title = title
  }

  const updateItemVideo = (id) => {
    const data = {
      ids: [id],
      type: 'media',
    }

    if (isPlayerWindow.value && window.electronAPI?.send) {
      window.electronAPI.send('getItemsFromDb', data)
    } else {
      eventBus.emit('getItemsFromDb', data)
    }
  }

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

    if (isPlayerWindow.value) {
      playerStore.mediaWindowTitle = ''
      document.title = appStore.app_title || 'MediaChips'
    }
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

  const initPlayer = () => {
    if (!playerStore.player) return
    isReady.value = false

    playerStore.player.addEventListener('loadedmetadata', () => {
      playerStore.duration = playerStore.player.duration
    })

    playerStore.player.addEventListener('ended', () => {
      if (playerStore.playlistMode.includes('autoplay') && controls.value) {
        controls.value.next()
      }
    })

    playerStore.player.addEventListener('error', () => {
      if (!playerStore.active || !playerStore.player?.src) return
      playerStore.playbackError = true
    })
  }

  const resolvePlayableVideo = async (initialVideo) => {
    const playlist = playerStore.playlist
    const candidates = []

    if (playlist.length > 0) {
      const foundIndex = _.findIndex(playlist, (i) => i.id == initialVideo.id)

      if (foundIndex >= 0) {
        for (let offset = 0; offset < playlist.length; offset++) {
          const index = (foundIndex + offset) % playlist.length
          candidates.push({video: playlist[index], index})
        }
      } else if (initialVideo?.path || initialVideo?.id) {
        candidates.push({video: initialVideo, index: 0})
      }
    } else if (initialVideo?.path) {
      candidates.push({video: initialVideo, index: 0})
    }

    for (const {video: candidate, index} of candidates) {
      if (!candidate?.path) continue

      if (await $operable.checkFileExists(candidate.path)) {
        return {video: candidate, index}
      }
    }

    if (initialVideo?.id) {
      const index = playlist.length > 0
        ? Math.max(0, _.findIndex(playlist, (i) => i.id == initialVideo.id))
        : 0
      return {video: initialVideo, index}
    }

    return null
  }

  const getMarks = async (media) => {
    try {
      const res = await axios.get(apiUrl.value + '/api/Mark/video/' + media.id)
      playerStore.marks = res.data

      if (playerStore.is_file_exists) {
        for (const mark of playerStore.marks) {
          const time = new Date(1000 * mark.time).toISOString().substr(11, 12)
          const imgPath = path.join(
            appStore.mediaPath || '',
            'videos/marks',
            `${mark.id}.jpg`
          )
          const exists = await $operable.checkFileExists(imgPath, true)
          if (exists) {
            eventBus.emit('updateMarkImage', mark.id)
            continue
          }

          try {
            await $operable.createThumb(time, media.path, imgPath, 180)
            eventBus.emit('updateMarkImage', mark.id)
          } catch (e) {
            console.log(e)
          }
        }

        if (marks.value?.getThumbs) {
          await marks.value.getThumbs()
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  const getMetadata = (media) => {
    return new Promise((resolve, reject) => {
      axios
        .get(apiUrl.value + '/api/videoMetadata/' + media.id)
        .then((res) => {
          playerStore.metadata = res.data
          playerStore.media = media
          resolve()
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  const loadSrc = async (media, start_time) => {
    isReady.value = false
    playerStore.playbackError = false

    const resolved = await resolvePlayableVideo(media)

    if (!resolved) {
      console.error('Player: No playable video found in playlist:', media?.path)
      playerStore.is_file_exists = false
      playerStore.playbackError = true
      isReady.value = true
      return
    }

    media = resolved.video
    const mediaType = findMediaTypeById(appStore.mediaTypes, media.mediaTypeId)
    playerStore.isAudioMode = isAudioMediaType(mediaType) || isAudioFilePath(media.path)
    playerStore.is_file_exists = await $operable.checkFileExists(media.path)

    if (playerStore.playlist.length > 0) {
      playerStore.nowPlaying = resolved.index
    }

    playerStore.player.src = apiUrl.value + '/api/video/' + media.id + '?time=' + Math.random()
    await getMarks(media)
    await getMetadata(media)
    playerStore.trackCurrentTime()

    playerStore.player.playbackRate = playerStore.speed

    if (start_time) {
      playerStore.player.currentTime = start_time
    } else {
      start_time = 0
      if (settings.value.restorePlaybackTime == '1') {
        if (playerStore.metadata.time && playerStore.metadata.duration) {
          if (!(playerStore.metadata.duration - playerStore.metadata.time < 5)) {
            start_time = playerStore.metadata.time
          }
        }
        playerStore.player.currentTime = start_time
      }
    }

    await itemsStore.countViewNumber(media, 'media')
    updateItemVideo(media.id)

    playerStore.playbackError = false
    dialogsStore.closeMarkAdding()

    if (!reg.value && playerStore.nowPlaying > 14) {
      playerStore.player.src = ''
    }

    if (isPlayerWindow.value) {
      updatePlayerWindowTitle(media)
    }

    playerStore.changePlayerStatusText({
      text: `${playerStore.nowPlaying + 1}. ${media.name}`,
      icon: 'format-list-bulleted',
    })

    isReady.value = true
  }

  const openPath = () => {
    $operable.openPath(video.value.path, false)
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
        const is_macos = navigator.platform.indexOf('Mac') > -1
        if (window.os && is_macos && window.electronAPI) {
          window.electronAPI.send('setFullScreen', false)
        }
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
    const response = await axios.post(apiUrl.value + '/api/TagsInMedia/createOne', {
      mediaId: video.value.id,
      tagId,
      metaId: metaId || appStore.getTagById(tagId)?.metaId,
    })

    if (response.data?.[1]) {
      $operable.setNotification({
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
      await axios.post(apiUrl.value + '/api/mark', mark)

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
      $operable.setNotification({
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
      await axios.delete(apiUrl.value + '/api/mark/' + mark.id)
      await getMarks(video.value)
    } catch (e) {
      console.log(e)
    }
  }

  const updatePlaybackTime = (media) => {
    return new Promise((resolve, reject) => {
      axios({
        method: 'put',
        url: apiUrl.value + '/api/videoMetadata/' + media.id,
        data: {
          time: playerStore.currentTime,
        },
      })
        .then(() => {
          updateItemVideo(media.id)
          resolve()
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  const nextVideo = () => {
    controls.value?.next?.()
  }

  const initPlayingVideo = (media, videos, time) => {
    if (!media || !videos) {
      $operable.setNotification({
        type: 'error',
        title: t('player.invalid_video_data'),
        text: t('player.could_not_play_video'),
      })
      return
    }

    playerStore.playlist = videos.map((i) => {
      const thumbUrl = i.thumb
        ? (i.thumb.startsWith('http') ? i.thumb : `${appStore.localhost}${i.thumb}`)
        : '/images/unavailable.png'

      return {
        ...i,
        thumb: thumbUrl,
      }
    })

    isReady.value = false
    playerStore.playbackError = false
    updatePlayerWindowTitle(media)
    loadSrc(media, time)
    playerStore.active = true

    const mediaTypeId = media.mediaTypeId || getDefaultMediaTypeId(appStore.mediaTypes)
    const url = `/api/MetaInMediaType?mediaTypeId=${mediaTypeId}`
    axios
      .get(apiUrl.value + url)
      .then((res) => {
        itemsStore.assigned = res.data
      })
      .catch((e) => {
        console.log('Error loading metadata:', e)
      })
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

  let unsubscribePlayerWindow = null

  onMounted(async () => {
    await nextTick()

    if (videoPlayer.value) {
      playerStore.player = videoPlayer.value
      initPlayer()
    }

    eventBus.on('playVideo', handlePlayVideoEvent)

    if (window.electronAPI) {
      window.electronAPI.on('play-video', (event, data) => {
        if (data?.video) {
          initPlayingVideo(data.video, data.videos, data.time)
        } else {
          $operable.setNotification({
            type: 'error',
            title: t('player.error_title'),
            text: t('player.invalid_video_data'),
          })
        }
      })

      window.electronAPI.on('stop-playing-video', () => {
        closePlayer()
      })
    } else if (isPlayerWindow.value) {
      const pending = consumePendingPlay()
      if (pending?.video) {
        initPlayingVideo(pending.video, pending.videos, pending.time)
      }

      unsubscribePlayerWindow = subscribePlayerWindowMessages((message) => {
        if (message?.type === 'play-video' && message.data?.video) {
          initPlayingVideo(message.data.video, message.data.videos, message.data.time)
        }
      })
    }

    if (document.addEventListener) {
      document.addEventListener('fullscreenchange', exitHandler, false)
      document.addEventListener('mozfullscreenchange', exitHandler, false)
      document.addEventListener('MSFullscreenChange', exitHandler, false)
      document.addEventListener('webkitfullscreenchange', exitHandler, false)
    }
  })

  onBeforeUnmount(() => {
    eventBus.off('playVideo', handlePlayVideoEvent)
    unsubscribePlayerWindow?.()
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
