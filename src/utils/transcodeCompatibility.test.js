import {describe, it, expect} from 'vitest'
import {analyzeProbeResult} from '../../api/services/transcode/codecCompatibility.js'
import {isLikelyBrowserDirectVideo} from '@/utils/transcodeCompatibility'

describe('isLikelyBrowserDirectVideo', () => {
  it('accepts mp4 and webm containers', () => {
    expect(isLikelyBrowserDirectVideo('/videos/sample.mp4')).toBe(true)
    expect(isLikelyBrowserDirectVideo('/videos/sample.webm')).toBe(true)
  })

  it('rejects mkv and avi containers', () => {
    expect(isLikelyBrowserDirectVideo('/videos/sample.mkv')).toBe(false)
    expect(isLikelyBrowserDirectVideo('/videos/sample.avi')).toBe(false)
  })
})

describe('analyzeProbeResult', () => {
  it('accepts mp4 with h264 and aac', () => {
    const probe = {
      streams: [
        {codec_type: 'video', codec_name: 'h264'},
        {codec_type: 'audio', codec_name: 'aac'},
      ],
    }

    expect(analyzeProbeResult(probe, '/videos/sample.mp4')).toEqual({
      playable: true,
      reason: null,
      videoCodec: 'h264',
      audioCodec: 'aac',
    })
  })

  it('rejects mkv even with h264', () => {
    const probe = {
      streams: [
        {codec_type: 'video', codec_name: 'h264'},
        {codec_type: 'audio', codec_name: 'aac'},
      ],
    }

    expect(analyzeProbeResult(probe, '/videos/sample.mkv')).toMatchObject({
      playable: false,
      reason: 'container',
    })
  })

  it('rejects hevc in mp4', () => {
    const probe = {
      streams: [
        {codec_type: 'video', codec_name: 'hevc'},
        {codec_type: 'audio', codec_name: 'aac'},
      ],
    }

    expect(analyzeProbeResult(probe, '/videos/sample.mp4')).toMatchObject({
      playable: false,
      reason: 'video_codec',
    })
  })

  it('accepts mp3 audio files', () => {
    const probe = {
      streams: [{codec_type: 'audio', codec_name: 'mp3'}],
    }

    expect(analyzeProbeResult(probe, '/audio/sample.mp3', {audioOnly: true})).toMatchObject({
      playable: true,
      reason: null,
    })
  })

  it('rejects wma audio files', () => {
    const probe = {
      streams: [{codec_type: 'audio', codec_name: 'wmav2'}],
    }

    expect(analyzeProbeResult(probe, '/audio/sample.wma', {audioOnly: true})).toMatchObject({
      playable: false,
      reason: 'container',
    })
  })
})
