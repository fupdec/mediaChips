export interface IgnorablePlaybackErrorParams {
  usesLiveTranscode?: boolean
  isLiveStreamSeeking?: boolean
  mediaErrorCode?: number
}

export function isIgnorablePlaybackError({
  usesLiveTranscode,
  isLiveStreamSeeking,
  mediaErrorCode,
}: IgnorablePlaybackErrorParams): boolean {
  if (isLiveStreamSeeking) return true
  if (!usesLiveTranscode) return false

  // MEDIA_ERR_ABORTED / MEDIA_ERR_NETWORK while restarting live stream.
  return mediaErrorCode === 1 || mediaErrorCode === 2
}

export interface AbsolutePlaybackTimeParams {
  usesLiveTranscode?: boolean
  liveStreamOffset?: number
  playerCurrentTime?: number
}

export function getAbsolutePlaybackTime({
  usesLiveTranscode,
  liveStreamOffset,
  playerCurrentTime,
}: AbsolutePlaybackTimeParams): number {
  if (usesLiveTranscode) {
    return (liveStreamOffset || 0) + (playerCurrentTime || 0)
  }

  return playerCurrentTime || 0
}

export interface BufferedRange {
  start: number
  end: number
}

export function getAbsoluteBufferedRanges(
  video: HTMLVideoElement | { buffered?: TimeRanges } | null | undefined,
  liveStreamOffset = 0,
): BufferedRange[] {
  if (!video?.buffered?.length) return []

  const offset = liveStreamOffset || 0
  const ranges: BufferedRange[] = []

  for (let index = 0; index < video.buffered.length; index += 1) {
    ranges.push({
      start: offset + video.buffered.start(index),
      end: offset + video.buffered.end(index),
    })
  }

  return ranges
}

export function getBufferedEnd(ranges: BufferedRange[] | null | undefined, currentTime = 0): number {
  if (!ranges?.length) return currentTime
  return Math.max(...ranges.map((range) => range.end))
}

export interface TimelinePercentsParams {
  currentTime: number
  duration: number
  bufferedRanges: BufferedRange[]
  usesLiveTranscode?: boolean
  isLiveStreamSeeking?: boolean
  isStreamWaiting?: boolean
}

export interface TimelinePercents {
  progress: number
  buffer: number
  showStream: boolean
}

export function getTimelinePercents({
  currentTime,
  duration,
  bufferedRanges,
  usesLiveTranscode = false,
  isLiveStreamSeeking = false,
  isStreamWaiting = false,
}: TimelinePercentsParams): TimelinePercents {
  if (!duration || duration <= 0) {
    return { progress: 0, buffer: 0, showStream: false }
  }

  const progress = Math.max(0, Math.min(100, (currentTime / duration) * 100))
  const bufferEnd = getBufferedEnd(bufferedRanges, currentTime)
  const buffer = Math.max(progress, Math.min(100, (bufferEnd / duration) * 100))

  const showStream = usesLiveTranscode && (isLiveStreamSeeking || isStreamWaiting || buffer < 99.5)

  return { progress, buffer, showStream }
}

export function shouldShowTranscodeTimeline({ usesLiveTranscode }: { usesLiveTranscode?: boolean }): boolean {
  return Boolean(usesLiveTranscode)
}
