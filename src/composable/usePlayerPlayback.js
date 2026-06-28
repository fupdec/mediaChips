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
import {isIgnorablePlaybackError} from '@/utils/playerBuffer'
import {
  getChunkStart,
  getNextChunkStart,
  LIVE_STREAM_CHUNK_SECONDS,
  LIVE_STREAM_PREFETCH_SECONDS,
} from '@/utils/liveStreamChunk.js'
import {
  buildVideoStreamUrl,
  buildLiveStreamUrl,
  fetchPlayableInfo,
  stopLiveTranscode,
  playWhenReady,
} from '@/services/transcodeService'
import {
  markLiveTranscodeSession,
  clearLiveTranscodeSessionMark,
} from '@/utils/liveTranscodeLifecycle'

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

function normalizeTranscodeMaxHeight(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return '0'
  return String(num)
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
      if (playerStore.usesLiveTranscode && playerStore.metadata?.duration) {
        playerStore.duration = playerStore.metadata.duration
      } else if (Number.isFinite(playerStore.player.duration) && playerStore.player.duration > 0) {
        playerStore.duration = playerStore.player.duration
      } else if (playerStore.metadata?.duration) {
        playerStore.duration = playerStore.metadata.duration
      }

      playerStore.syncPlaybackState()
    })

    playerStore.player.addEventListener('timeupdate', () => {
      playerStore.syncPlaybackState()
      maybeAdvanceLiveStreamChunk()
    })

    playerStore.player.addEventListener('progress', () => {
      playerStore.syncPlaybackState()
    })

    playerStore.player.addEventListener('ended', async () => {
      if (playerStore.usesLiveTranscode) {
        const nextStart = getNextChunkStart(
          playerStore.liveStreamOffset,
          playerStore.duration,
        )
        if (nextStart != null) {
          const advanced = await switchLiveStreamChunk(nextStart)
          if (advanced) return
        }
      }

      if (playerStore.playlistMode.includes('autoplay') && controls.value) {
        controls.value.next()
      }
    })

    playerStore.player.addEventListener('error', () => {
      if (!playerStore.active || !playerStore.player?.src) return

      if (isIgnorablePlaybackError({
        usesLiveTranscode: playerStore.usesLiveTranscode,
        isLiveStreamSeeking: playerStore.isLiveStreamSeeking,
        mediaErrorCode: playerStore.player.error?.code,
      })) {
        return
      }

      playerStore.playbackError = true
    })

    playerStore.player.addEventListener('waiting', () => {
      if (!playerStore.usesLiveTranscode) return
      playerStore.isStreamWaiting = true
    })

    playerStore.player.addEventListener('playing', () => {
      if (!playerStore.usesLiveTranscode) return
      playerStore.liveTranscodeStarted = true
      playerStore.isStreamWaiting = false
      playerStore.playbackError = false
      playerStore.isLiveStreamSeeking = false
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

  let transcodeSessionId = 0
  let currentLiveMediaId = null
  let liveStreamSeekGeneration = 0
  let isAdvancingChunk = false
  let pendingNextChunkStart = null

  const resetTranscodeState = () => {
    playerStore.transcodeActive = false
    playerStore.transcodeProgress = 0
    playerStore.transcodeStatus = 'none'
    playerStore.transcodeError = null
  }

  const stopLiveTranscodeSession = (mediaId = currentLiveMediaId) => {
    if (!mediaId) return Promise.resolve()
    return stopLiveTranscode(apiClient, mediaId).catch((error) => {
      console.warn('Failed to stop live transcode session:', error)
    })
  }

  const clearLiveTranscodeHandlers = () => {
    const stoppingMediaId = currentLiveMediaId
    playerStore.usesLiveTranscode = false
    playerStore.liveTranscodeStarted = false
    playerStore.liveTranscodeMediaId = null
    playerStore.liveTranscodeMaxHeight = '1080'
    playerStore.liveStreamSeekHandler = null
    playerStore.liveStreamOffset = 0
    playerStore.bufferedRanges = []
    playerStore.isLiveStreamSeeking = false
    playerStore.isStreamWaiting = false
    currentLiveMediaId = null
    isAdvancingChunk = false
    pendingNextChunkStart = null
    liveStreamSeekGeneration += 1
    seekLiveStream.cancel?.()
    maybeAdvanceLiveStreamChunk.cancel?.()

    if (stoppingMediaId) {
      stopLiveTranscodeSession(stoppingMediaId)
    }

    clearLiveTranscodeSessionMark()
  }

  const switchLiveStreamChunk = async (nextChunkStart) => {
    if (!currentLiveMediaId || !playerStore.player || nextChunkStart == null) return false

    const seekGeneration = ++liveStreamSeekGeneration
    isAdvancingChunk = true
    pendingNextChunkStart = null
    const wasPaused = playerStore.paused

    playerStore.isLiveStreamSeeking = true
    playerStore.playbackError = false
    playerStore.liveStreamOffset = nextChunkStart
    playerStore.bufferedRanges = []
    playerStore.player.src = buildLiveStreamUrl(
      buildApiUrl,
      currentLiveMediaId,
      nextChunkStart,
      playerStore.liveTranscodeMaxHeight,
    )
    playerStore.currentTime = nextChunkStart

    try {
      if (!wasPaused) {
        await playWhenReady(playerStore.player)
        playerStore.paused = false
      }
    } catch (error) {
      if (seekGeneration === liveStreamSeekGeneration && !isIgnorablePlaybackError({
        usesLiveTranscode: true,
        isLiveStreamSeeking: true,
        mediaErrorCode: playerStore.player.error?.code,
      })) {
        console.log(error)
      }
    } finally {
      if (seekGeneration === liveStreamSeekGeneration) {
        isAdvancingChunk = false
        playerStore.isLiveStreamSeeking = false
        playerStore.syncPlaybackState()
      }
    }

    return seekGeneration === liveStreamSeekGeneration
  }

  const maybeAdvanceLiveStreamChunk = _.debounce(async () => {
    if (!playerStore.usesLiveTranscode || !playerStore.player || isAdvancingChunk) return
    if (playerStore.isLiveStreamSeeking || playerStore.paused) return

    const chunkStart = playerStore.liveStreamOffset
    const relativeTime = playerStore.player.currentTime || 0
    const nextStart = getNextChunkStart(chunkStart, playerStore.duration)
    if (nextStart == null) return

    const prefetchAt = LIVE_STREAM_CHUNK_SECONDS - LIVE_STREAM_PREFETCH_SECONDS
    if (relativeTime < prefetchAt) return
    if (pendingNextChunkStart === nextStart) return

    pendingNextChunkStart = nextStart
    await switchLiveStreamChunk(nextStart)
  }, 200)

  const seekLiveStream = _.debounce(async (time) => {
    if (!currentLiveMediaId || !playerStore.player) return

    const chunkStart = getChunkStart(time)
    const seekGeneration = ++liveStreamSeekGeneration
    const wasPaused = playerStore.paused
    isAdvancingChunk = false
    pendingNextChunkStart = null
    playerStore.isLiveStreamSeeking = true
    playerStore.playbackError = false
    playerStore.liveStreamOffset = chunkStart
    playerStore.bufferedRanges = []
    playerStore.player.src = buildLiveStreamUrl(
      buildApiUrl,
      currentLiveMediaId,
      chunkStart,
      playerStore.liveTranscodeMaxHeight,
    )
    playerStore.currentTime = chunkStart

    const onPlaying = () => {
      if (seekGeneration !== liveStreamSeekGeneration) return
      playerStore.isLiveStreamSeeking = false
      playerStore.playbackError = false
      playerStore.syncPlaybackState()
    }

    playerStore.player.addEventListener('playing', onPlaying, {once: true})

    if (!wasPaused) {
      try {
        await playWhenReady(playerStore.player)
        playerStore.paused = false
      } catch (error) {
        if (seekGeneration !== liveStreamSeekGeneration) return
        if (isIgnorablePlaybackError({
          usesLiveTranscode: true,
          isLiveStreamSeeking: true,
          mediaErrorCode: playerStore.player.error?.code,
        })) {
          return
        }
        console.log(error)
      }
    }

    if (seekGeneration !== liveStreamSeekGeneration) return

    playerStore.syncPlaybackState()

    window.setTimeout(() => {
      if (seekGeneration !== liveStreamSeekGeneration) return
      if (!playerStore.isLiveStreamSeeking) return
      playerStore.isLiveStreamSeeking = false
    }, 15000)
  }, 250)

  const resolveVideoSource = async (mediaId, startTime = 0) => {
    clearLiveTranscodeHandlers()

    if (settingsStore.transcodeUnsupportedFormats !== '1') {
      return buildVideoStreamUrl(buildApiUrl, mediaId, 'direct')
    }

    const playable = await fetchPlayableInfo(apiClient, mediaId)

    if (!playable.transcodeRequired) {
      resetTranscodeState()
      return buildVideoStreamUrl(buildApiUrl, mediaId, 'auto')
    }

    const chunkStart = getChunkStart(startTime)
    currentLiveMediaId = mediaId
    playerStore.usesLiveTranscode = true
    playerStore.liveTranscodeMediaId = mediaId
    playerStore.liveTranscodeMaxHeight = normalizeTranscodeMaxHeight(settingsStore.transcodeMaxHeight)
    playerStore.transcodeStatus = 'stream'
    playerStore.liveStreamSeekHandler = (time) => {
      playerStore.currentTime = time
      seekLiveStream(time)
    }

    playerStore.liveStreamOffset = chunkStart
    resetTranscodeState()
    playerStore.transcodeStatus = 'stream'
    markLiveTranscodeSession(mediaId)
    return buildLiveStreamUrl(buildApiUrl, mediaId, chunkStart, playerStore.liveTranscodeMaxHeight)
  }

  const loadSrc = async (media, start_time) => {
    transcodeSessionId += 1
    resetTranscodeState()
    clearLiveTranscodeHandlers()
    playerStore.liveTranscodeStarted = false
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

    await getMetadata(media)
    if (playerStore.metadata?.duration) {
      playerStore.duration = playerStore.metadata.duration
    }

    let targetStartTime = start_time || 0
    if (!start_time && settingsStore.restorePlaybackTime == '1') {
      if (playerStore.metadata.time && playerStore.metadata.duration) {
        if (!(playerStore.metadata.duration - playerStore.metadata.time < 5)) {
          targetStartTime = playerStore.metadata.time
        }
      }
    }

    try {
      playerStore.player.src = await resolveVideoSource(media.id, targetStartTime)
    } catch (error) {
      console.error('Player: Failed to prepare video source:', error)
      clearLiveTranscodeHandlers()
      resetTranscodeState()
      playerStore.playbackError = true
      isReady.value = true
      return
    }

    playerStore.media = media
    await getMarks(media)
    playerStore.trackCurrentTime()
    playerStore.player.playbackRate = playerStore.speed

    if (!playerStore.usesLiveTranscode) {
      if (start_time) {
        playerStore.player.currentTime = start_time
      } else if (targetStartTime) {
        playerStore.player.currentTime = targetStartTime
      }
    } else {
      const chunkStart = getChunkStart(targetStartTime)
      playerStore.liveStreamOffset = chunkStart
      playerStore.currentTime = chunkStart
      playerStore.bufferedRanges = []
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
      if (playerStore.usesLiveTranscode) {
        await playWhenReady(videoEl)
      } else {
        await videoEl.play()
      }
      playerStore.paused = false
    } catch (e) {
      if (!playerStore.usesLiveTranscode || !isIgnorablePlaybackError({
        usesLiveTranscode: playerStore.usesLiveTranscode,
        isLiveStreamSeeking: playerStore.isLiveStreamSeeking,
        mediaErrorCode: videoEl.error?.code,
      })) {
        console.log(e)
      }
    }

    isReady.value = true
  }

  const updatePlaybackTime = async (media) => {
    try {
      await apiClient.put(`/api/videoMetadata/${media.id}`, {
        time: playerStore.currentTime,
      })
      updateItemVideo(media.id)
    } catch (error) {
      console.warn('Failed to save playback time:', error)
    }
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
    stopLiveTranscodeSession,
    initPlayingVideo,
  }
}
