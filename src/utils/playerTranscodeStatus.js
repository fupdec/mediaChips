export function getTranscodePlayerStatus(state, t) {
  if (!state?.active || state.playbackError) return null

  const {
    usesLiveTranscode,
    liveTranscodeStarted,
    isLiveStreamSeeking,
    isStreamWaiting,
    transcodeError,
    transcodeStatus,
  } = state

  if (transcodeStatus === 'error' && transcodeError) {
    return {
      text: `${t('player.transcode_error')}: ${transcodeError}`,
      icon: 'alert',
    }
  }

  if (!usesLiveTranscode) return null

  if (isLiveStreamSeeking || isStreamWaiting) {
    return {
      text: t('player.transcode_buffering'),
      icon: 'cached',
    }
  }

  if (!liveTranscodeStarted) {
    return {
      text: t('player.transcode_preparing'),
      icon: 'video',
    }
  }

  return null
}
