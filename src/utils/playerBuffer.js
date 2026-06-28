export function isIgnorablePlaybackError({
  usesLiveTranscode,
  isLiveStreamSeeking,
  mediaErrorCode,
}) {
  if (isLiveStreamSeeking) return true
  if (!usesLiveTranscode) return false

  // MEDIA_ERR_ABORTED / MEDIA_ERR_NETWORK while restarting live stream.
  return mediaErrorCode === 1 || mediaErrorCode === 2
}

export function getAbsolutePlaybackTime({
  usesLiveTranscode,
  liveStreamOffset,
  playerCurrentTime,
}) {
  if (usesLiveTranscode) {
    return (liveStreamOffset || 0) + (playerCurrentTime || 0)
  }

  return playerCurrentTime || 0
}

export function getAbsoluteBufferedRanges(video, liveStreamOffset = 0) {
  if (!video?.buffered?.length) return []

  const offset = liveStreamOffset || 0
  const ranges = []

  for (let index = 0; index < video.buffered.length; index += 1) {
    ranges.push({
      start: offset + video.buffered.start(index),
      end: offset + video.buffered.end(index),
    })
  }

  return ranges
}

export function getBufferedEnd(ranges, currentTime = 0) {
  if (!ranges?.length) return currentTime
  return Math.max(...ranges.map((range) => range.end))
}

export function getTimelinePercents({
  currentTime,
  duration,
  bufferedRanges,
  usesLiveTranscode = false,
  isLiveStreamSeeking = false,
  isStreamWaiting = false,
}) {
  if (!duration || duration <= 0) {
    return {progress: 0, buffer: 0, showStream: false}
  }

  const progress = Math.max(0, Math.min(100, (currentTime / duration) * 100))
  const bufferEnd = getBufferedEnd(bufferedRanges, currentTime)
  const buffer = Math.max(progress, Math.min(100, (bufferEnd / duration) * 100))

  const showStream = usesLiveTranscode && (isLiveStreamSeeking || isStreamWaiting || buffer < 99.5)

  return {progress, buffer, showStream}
}

export function shouldShowTranscodeTimeline({usesLiveTranscode}) {
  return usesLiveTranscode
}
