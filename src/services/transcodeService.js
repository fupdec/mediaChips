import {
  getChunkStart,
} from '@/utils/liveStreamChunk.js'

const LIVE_STREAM_RETRY_DELAY_MS = 400

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

export function buildLiveStreamUrl(buildApiUrl, mediaId, startSeconds = 0, maxHeight = null) {
  const start = getChunkStart(startSeconds)
  const params = new URLSearchParams({
    start: String(start),
    time: String(Math.random()),
  })

  if (maxHeight != null && maxHeight !== '') {
    params.set('maxHeight', String(maxHeight))
  }

  return `${buildApiUrl(`/api/video/${mediaId}/transcode/stream`)}?${params.toString()}`
}

export class UnsupportedPlaybackError extends Error {
  constructor(message = 'unsupported_format') {
    super(message)
    this.name = 'UnsupportedPlaybackError'
    this.code = 'unsupported_format'
  }
}

export async function resolvePreviewVideoUrl(apiClient, buildApiUrl, mediaId, startSeconds = 0) {
  try {
    const playable = await fetchPlayableInfo(apiClient, mediaId)
    if (playable.mode === 'unsupported') {
      return null
    }
    if (playable.transcodeRequired || playable.streamPlayback || playable.mode === 'stream') {
      return buildLiveStreamUrl(buildApiUrl, mediaId, startSeconds)
    }
    return buildVideoStreamUrl(buildApiUrl, mediaId, 'auto')
  } catch {
    return buildVideoStreamUrl(buildApiUrl, mediaId, 'auto')
  }
}

const MEDIA_ERR_ABORTED = 1
const MEDIA_ERR_NETWORK = 2
const MEDIA_ERR_DECODE = 3
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4

export function playWhenReady(videoEl, {timeout = 60000} = {}) {
  return new Promise((resolve, reject) => {
    if (!videoEl) {
      reject(new Error('No video element'))
      return
    }

    const tryPlay = () => {
      videoEl.play().then(resolve).catch(reject)
    }

    if (videoEl.readyState >= 3) {
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

export async function playLiveStreamWhenReady(videoEl, getStreamUrl, {retries = 6, timeout = 60000} = {}) {
  let lastError

  for (let attempt = 0; attempt < retries; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, LIVE_STREAM_RETRY_DELAY_MS * attempt * attempt)
      })
    }

    videoEl.src = getStreamUrl()

    try {
      await playWhenReady(videoEl, {timeout})
      return
    } catch (error) {
      lastError = error
      if (attempt >= retries - 1) break

      const code = videoEl.error?.code
      if (code != null
        && code !== MEDIA_ERR_SRC_NOT_SUPPORTED
        && code !== MEDIA_ERR_NETWORK
        && code !== MEDIA_ERR_DECODE
        && code !== MEDIA_ERR_ABORTED) {
        break
      }
    }
  }

  throw lastError || new Error('Live stream playback failed')
}
