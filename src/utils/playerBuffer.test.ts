import { describe, it, expect } from 'vitest'
import {
  getAbsolutePlaybackTime,
  getAbsoluteBufferedRanges,
  getBufferedEnd,
  getTimelinePercents,
  isIgnorablePlaybackError,
  shouldShowTranscodeTimeline,
} from '@/utils/playerBuffer'

describe('playerBuffer', () => {
  it('adds live stream offset to playback time', () => {
    expect(getAbsolutePlaybackTime({
      usesLiveTranscode: true,
      liveStreamOffset: 120,
      playerCurrentTime: 15.5,
    })).toBe(135.5)
  })

  it('returns raw playback time for direct streams', () => {
    expect(getAbsolutePlaybackTime({
      usesLiveTranscode: false,
      liveStreamOffset: 120,
      playerCurrentTime: 15.5,
    })).toBe(15.5)
  })

  it('maps buffered ranges to absolute timeline positions', () => {
    const video = {
      buffered: {
        length: 2,
        start: (index: number) => (index === 0 ? 0 : 20),
        end: (index: number) => (index === 0 ? 12 : 35),
      },
    }

    expect(getAbsoluteBufferedRanges(video, 100)).toEqual([
      { start: 100, end: 112 },
      { start: 120, end: 135 },
    ])
  })

  it('returns buffered end for timeline', () => {
    expect(getBufferedEnd([
      { start: 100, end: 130 },
      { start: 130, end: 160 },
    ], 105)).toBe(160)
  })

  it('converts playback state to timeline percents', () => {
    expect(getTimelinePercents({
      currentTime: 50,
      duration: 200,
      bufferedRanges: [{ start: 0, end: 120 }],
    })).toEqual({
      progress: 25,
      buffer: 60,
      showStream: false,
    })
  })

  it('shows stream animation during live transcode', () => {
    expect(getTimelinePercents({
      currentTime: 50,
      duration: 200,
      bufferedRanges: [{ start: 0, end: 80 }],
      usesLiveTranscode: true,
      isStreamWaiting: true,
    })).toMatchObject({
      progress: 25,
      showStream: true,
    })
  })

  it('detects when transcode timeline should be visible', () => {
    expect(shouldShowTranscodeTimeline({
      usesLiveTranscode: false,
    })).toBe(false)

    expect(shouldShowTranscodeTimeline({
      usesLiveTranscode: true,
    })).toBe(true)
  })

  it('ignores abort/network errors during live transcode seek', () => {
    expect(isIgnorablePlaybackError({
      usesLiveTranscode: true,
      isLiveStreamSeeking: true,
      mediaErrorCode: 4,
    })).toBe(true)

    expect(isIgnorablePlaybackError({
      usesLiveTranscode: true,
      isLiveStreamSeeking: false,
      mediaErrorCode: 1,
    })).toBe(true)

    expect(isIgnorablePlaybackError({
      usesLiveTranscode: true,
      isLiveStreamSeeking: false,
      mediaErrorCode: 4,
    })).toBe(false)
  })
})
