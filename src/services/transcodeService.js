import {
  getChunkStart,
} from '@/utils/liveStreamChunk.js'

export function fetchPlayableInfo(apiClient, mediaId) {
  return apiClient.get(`/api/video/${mediaId}/playable`).then((response) => response.data)
}

export function stopLiveTranscode(apiClient, mediaId) {
  return apiClient.delete(`/api/video/${mediaId}/transcode/stream`).then((response) => response.data)
}

export function fetchTranscodeCacheStats(apiClient) {
  return apiClient.get('/api/transcode/cache').then((response) => response.data)
}

export function buildVideoStreamUrl(buildApiUrl, mediaId, source = 'auto') {
  return `${buildApiUrl(`/api/video/${mediaId}`)}?source=${source}&time=${Math.random()}`
}

export function buildLiveStreamUrl(buildApiUrl, mediaId, startSeconds = 0) {
  const start = getChunkStart(startSeconds)
  return `${buildApiUrl(`/api/video/${mediaId}/transcode/stream`)}?start=${start}&time=${Math.random()}`
}

export function playWhenReady(videoEl, {timeout = 60000} = {}) {
  return new Promise((resolve, reject) => {
    if (!videoEl) {
      reject(new Error('No video element'))
      return
    }

    const tryPlay = () => {
      videoEl.play().then(resolve).catch(reject)
    }

    if (videoEl.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      tryPlay()
      return
    }

    let timeoutId

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId)
      videoEl.removeEventListener('canplay', onCanPlay)
      videoEl.removeEventListener('error', onError)
    }

    const onCanPlay = () => {
      cleanup()
      tryPlay()
    }

    const onError = () => {
      cleanup()
      reject(videoEl.error || new Error('Video failed to load'))
    }

    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('Video load timeout'))
    }, timeout)

    videoEl.addEventListener('canplay', onCanPlay, {once: true})
    videoEl.addEventListener('error', onError, {once: true})
  })
}
