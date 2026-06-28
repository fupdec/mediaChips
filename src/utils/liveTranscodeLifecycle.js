const LIVE_TRANSCODE_SESSION_KEY = 'mcLiveTranscodeMediaId'

export function markLiveTranscodeSession(mediaId) {
  if (mediaId == null || mediaId === '') return

  try {
    sessionStorage.setItem(LIVE_TRANSCODE_SESSION_KEY, String(mediaId))
  } catch {
    // ignore storage errors
  }
}

export function clearLiveTranscodeSessionMark() {
  try {
    sessionStorage.removeItem(LIVE_TRANSCODE_SESSION_KEY)
  } catch {
    // ignore storage errors
  }
}

export function getMarkedLiveTranscodeMediaId() {
  try {
    return sessionStorage.getItem(LIVE_TRANSCODE_SESSION_KEY)
  } catch {
    return null
  }
}

export function abortVideoPlayback(videoEl) {
  if (!videoEl) return

  try {
    videoEl.pause()
  } catch {
    // ignore
  }

  try {
    videoEl.removeAttribute('src')
    videoEl.load()
  } catch {
    // ignore
  }
}

export function stopLiveTranscodeRequest(stopUrl, {keepalive = false} = {}) {
  if (!stopUrl) return Promise.resolve()

  return fetch(stopUrl, {
    method: 'DELETE',
    keepalive,
  }).catch(() => {})
}

export function stopAllLiveTranscodeStreams(stopAllUrl, {keepalive = false} = {}) {
  if (!stopAllUrl) return Promise.resolve()

  return fetch(stopAllUrl, {
    method: 'DELETE',
    keepalive,
  }).catch(() => {})
}

export async function cleanupOrphanedLiveTranscode({buildStopUrl, stopAllUrl}) {
  await stopAllLiveTranscodeStreams(stopAllUrl)

  const mediaId = getMarkedLiveTranscodeMediaId()
  if (!mediaId) return

  clearLiveTranscodeSessionMark()
  await stopLiveTranscodeRequest(buildStopUrl(mediaId))
}

export function installLiveTranscodeUnloadGuard({
  getMediaId,
  buildStopUrl,
  stopAllUrl,
  abortPlayback,
}) {
  const handlePageHide = () => {
    const mediaId = getMediaId?.()

    abortPlayback?.()
    clearLiveTranscodeSessionMark()
    stopAllLiveTranscodeStreams(stopAllUrl, {keepalive: true})

    if (!mediaId) return

    stopLiveTranscodeRequest(buildStopUrl(mediaId), {keepalive: true})
  }

  window.addEventListener('pagehide', handlePageHide)

  return () => {
    window.removeEventListener('pagehide', handlePageHide)
  }
}
