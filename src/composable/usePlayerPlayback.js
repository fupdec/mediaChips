import {nextTick} from 'vue'
import _ from 'lodash'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useSettingsStore} from '@/stores/settings'
import {useDialogsStore} from '@/stores/dialogs'
import {useRegistrationStore} from '@/stores/registration'
import {useItemsStore} from '@/stores/items'
import {useEventBus} from '@/utils/eventBus'
import {
  getDefaultMediaTypeId,
  findMediaTypeById,
  isAudioMediaType,
  isAudioFilePath,
} from '@/utils/mediaType'
import {apiClient, buildApiUrl} from '@/services/apiClient'
import {checkFileExists} from '@/services/fileService'
import {setNotification} from '@/services/notificationService'
import {ensureMarkThumb, getMarkImagePath} from '@/utils/markThumb'

export async function resolvePlayableVideo(playlist, initialVideo, checkFileExists) {
  const candidates = []

  if (playlist.length > 0) {
    const foundIndex = _.findIndex(playlist, (item) => item.id == initialVideo.id)

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

    if (await checkFileExists(candidate.path)) {
      return {video: candidate, index}
    }
  }

  if (initialVideo?.id) {
    const index = playlist.length > 0
      ? Math.max(0, _.findIndex(playlist, (item) => item.id == initialVideo.id))
      : 0
    return {video: initialVideo, index}
  }

  return null
}

export function usePlayerPlayback({
  isReady,
  videoPlayer,
  controls,
  marks,
  isPlayerWindow,
  updateItemVideo,
  updatePlayerWindowTitle,
}) {
  const appStore = useAppStore()
  const playerStore = usePlayerStore()
  const settingsStore = useSettingsStore()
  const dialogsStore = useDialogsStore()
  const registrationStore = useRegistrationStore()
  const itemsStore = useItemsStore()
  const eventBus = useEventBus()
  const {t} = useI18n()

  const initPlayer = () => {
    if (!playerStore.player) return
    if (playerStore.player.dataset.playerBound === '1') return

    playerStore.player.dataset.playerBound = '1'
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

  const bindVideoElement = (el) => {
    if (!el) return

    playerStore.player = el
    initPlayer()
  }

  const ensureVideoElement = async () => {
    if (playerStore.player) return playerStore.player

    await nextTick()
    bindVideoElement(videoPlayer.value)
    return playerStore.player
  }

  const getMarks = async (media) => {
    try {
      const res = await apiClient.get(`/api/Mark/video/${media.id}`)
      playerStore.marks = res.data

      if (!media?.id || !appStore.mediaPath) return

      for (const mark of playerStore.marks) {
        const imgPath = getMarkImagePath(appStore.mediaPath, mark.id)
        const exists = await checkFileExists(imgPath)
        if (exists) {
          eventBus.emit('updateMarkImage', mark.id)
          continue
        }

        try {
          await ensureMarkThumb({
            mark,
            videoPath: media.path,
            mediaPath: appStore.mediaPath,
            mediaId: media.id,
            onUpdated: (markId) => eventBus.emit('updateMarkImage', markId),
          })
        } catch (e) {
          console.error('Failed to create mark thumb:', e)
        }
      }

      eventBus.emit('refreshMarkThumbs')

      if (marks.value?.getThumbs) {
        await marks.value.getThumbs()
      }
    } catch (e) {
      console.error('Failed to load marks:', e)
    }
  }

  const getMetadata = async (media) => {
    const res = await apiClient.get(`/api/videoMetadata/${media.id}`)
    playerStore.metadata = res.data
    playerStore.media = media
  }

  const loadSrc = async (media, start_time) => {
    isReady.value = false
    playerStore.playbackError = false

    const resolved = await resolvePlayableVideo(
      playerStore.playlist,
      media,
      (filePath) => checkFileExists(filePath),
    )

    if (!resolved) {
      console.error('Player: No playable video found in playlist:', media?.path)
      playerStore.is_file_exists = false
      playerStore.playbackError = true
      isReady.value = true
      return
    }

    const videoEl = await ensureVideoElement()
    if (!videoEl) {
      console.error('Player: Video element is not available')
      playerStore.playbackError = true
      isReady.value = true
      return
    }

    media = resolved.video
    const mediaType = findMediaTypeById(appStore.mediaTypes, media.mediaTypeId)
    playerStore.isAudioMode = isAudioMediaType(mediaType) || isAudioFilePath(media.path)
    playerStore.is_file_exists = await checkFileExists(media.path)

    if (playerStore.playlist.length > 0) {
      playerStore.nowPlaying = resolved.index
    }

    playerStore.player.src = `${buildApiUrl(`/api/video/${media.id}`)}?time=${Math.random()}`
    playerStore.media = media
    await getMarks(media)
    await getMetadata(media)
    playerStore.trackCurrentTime()
    playerStore.player.playbackRate = playerStore.speed

    if (start_time) {
      playerStore.player.currentTime = start_time
    } else {
      let resumeTime = 0
      if (settingsStore.restorePlaybackTime == '1') {
        if (playerStore.metadata.time && playerStore.metadata.duration) {
          if (!(playerStore.metadata.duration - playerStore.metadata.time < 5)) {
            resumeTime = playerStore.metadata.time
          }
        }
      }
      playerStore.player.currentTime = resumeTime
    }

    await itemsStore.countViewNumber(media, 'media')
    updateItemVideo(media.id)

    playerStore.playbackError = false
    dialogsStore.closeMarkAdding()

    if (!registrationStore.reg && playerStore.nowPlaying > 14) {
      playerStore.player.src = ''
    }

    if (isPlayerWindow.value) {
      updatePlayerWindowTitle(media)
    }

    playerStore.changePlayerStatusText({
      text: `${playerStore.nowPlaying + 1}. ${media.name}`,
      icon: 'format-list-bulleted',
    })

    try {
      await videoEl.play()
      playerStore.paused = false
    } catch (e) {
      console.log(e)
    }

    isReady.value = true
  }

  const updatePlaybackTime = async (media) => {
    await apiClient.put(`/api/videoMetadata/${media.id}`, {
      time: playerStore.currentTime,
    })
    updateItemVideo(media.id)
  }

  const initPlayingVideo = async (media, videos, time) => {
    if (!media || !videos) {
      setNotification({
        type: 'error',
        title: t('player.invalid_video_data'),
        text: t('player.could_not_play_video'),
      })
      return
    }

    playerStore.playlist = videos.map((item) => {
      const thumbUrl = item.thumb
        ? (item.thumb.startsWith('http') ? item.thumb : buildApiUrl(item.thumb))
        : '/images/unavailable.png'

      return {
        ...item,
        thumb: thumbUrl,
      }
    })

    isReady.value = false
    playerStore.playbackError = false
    playerStore.active = true
    updatePlayerWindowTitle(media)

    await nextTick()
    await loadSrc(media, time)

    const mediaTypeId = media.mediaTypeId || getDefaultMediaTypeId(appStore.mediaTypes)
    try {
      const res = await apiClient.get('/api/MetaInMediaType', {
        params: {mediaTypeId},
      })
      itemsStore.assigned = res.data
    } catch (e) {
      console.log('Error loading metadata:', e)
    }
  }

  return {
    bindVideoElement,
    ensureVideoElement,
    getMarks,
    loadSrc,
    updatePlaybackTime,
    initPlayingVideo,
  }
}
