import {describe, it, expect} from 'vitest'
import {getTranscodePlayerStatus} from '@/utils/playerTranscodeStatus'

const t = (key) => key

describe('getTranscodePlayerStatus', () => {
  it('returns preparing state before live transcode starts', () => {
    expect(getTranscodePlayerStatus({
      active: true,
      playbackError: false,
      usesLiveTranscode: true,
      liveTranscodeStarted: false,
      isLiveStreamSeeking: false,
      isStreamWaiting: false,
      transcodeStatus: 'stream',
      transcodeError: null,
    }, t)).toEqual({
      text: 'player.transcode_preparing',
      icon: 'video',
    })
  })

  it('returns buffering state during seek', () => {
    expect(getTranscodePlayerStatus({
      active: true,
      playbackError: false,
      usesLiveTranscode: true,
      liveTranscodeStarted: true,
      isLiveStreamSeeking: true,
      isStreamWaiting: false,
      transcodeStatus: 'stream',
      transcodeError: null,
    }, t)).toEqual({
      text: 'player.transcode_buffering',
      icon: 'cached',
    })
  })

  it('returns transcode error status when stream fails', () => {
    expect(getTranscodePlayerStatus({
      active: true,
      playbackError: false,
      usesLiveTranscode: true,
      liveTranscodeStarted: false,
      isLiveStreamSeeking: false,
      isStreamWaiting: false,
      transcodeStatus: 'error',
      transcodeError: 'ffmpeg exited',
    }, t)).toEqual({
      text: 'player.transcode_error: ffmpeg exited',
      icon: 'alert',
    })
  })

  it('returns buffering state while stream is waiting', () => {
    expect(getTranscodePlayerStatus({
      active: true,
      playbackError: false,
      usesLiveTranscode: true,
      liveTranscodeStarted: true,
      isLiveStreamSeeking: false,
      isStreamWaiting: true,
      transcodeStatus: 'stream',
      transcodeError: null,
    }, t)).toEqual({
      text: 'player.transcode_buffering',
      icon: 'cached',
    })
  })
})
