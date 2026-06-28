import {describe, it, expect, vi, beforeEach} from 'vitest'
import {
  buildLiveStreamUrl,
  buildVideoStreamUrl,
  playLiveStreamWhenReady,
  playWhenReady,
  resolvePreviewVideoUrl,
} from '@/services/transcodeService'

describe('transcodeService urls', () => {
  const buildApiUrl = (path) => `http://localhost:12321${path}`

  it('builds live stream url with start offset', () => {
    const url = buildLiveStreamUrl(buildApiUrl, 42, 125.5)
    expect(url).toContain('/api/video/42/transcode/stream')
    expect(url).toContain('start=120')
  })

  it('builds live stream url with max height', () => {
    const url = buildLiveStreamUrl(buildApiUrl, 42, 0, '720')
    expect(url).toContain('maxHeight=720')
  })

  it('builds direct video stream url', () => {
    const url = buildVideoStreamUrl(buildApiUrl, 7, 'auto')
    expect(url).toContain('/api/video/7?source=auto')
  })
})

describe('resolvePreviewVideoUrl', () => {
  const buildApiUrl = (path) => `http://localhost:12321${path}`

  it('uses live stream url when transcode is required', async () => {
    const apiClient = {
      get: vi.fn().mockResolvedValue({
        data: {transcodeRequired: true, mode: 'stream', streamPlayback: true},
      }),
    }

    const url = await resolvePreviewVideoUrl(apiClient, buildApiUrl, 15, 30)
    expect(url).toContain('/api/video/15/transcode/stream')
    expect(url).toContain('start=30')
  })

  it('returns null when format is unsupported and transcode is disabled', async () => {
    const apiClient = {
      get: vi.fn().mockResolvedValue({
        data: {mode: 'unsupported', transcodeRequired: false},
      }),
    }

    expect(await resolvePreviewVideoUrl(apiClient, buildApiUrl, 15)).toBeNull()
  })

  it('falls back to direct stream url when playable check fails', async () => {
    const apiClient = {
      get: vi.fn().mockRejectedValue(new Error('offline')),
    }

    const url = await resolvePreviewVideoUrl(apiClient, buildApiUrl, 9)
    expect(url).toContain('/api/video/9?source=auto')
  })
})

describe('playLiveStreamWhenReady', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('retries live stream playback after load failure', async () => {
    const videoEl = {
      src: '',
      readyState: 4,
      error: {code: 2},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      play: vi.fn()
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce(undefined),
    }

    let attempt = 0
    const promise = playLiveStreamWhenReady(
      videoEl,
      () => {
        attempt += 1
        return `http://localhost/stream?attempt=${attempt}`
      },
      {retries: 2, timeout: 1000},
    )

    await vi.runAllTimersAsync()
    await promise

    expect(videoEl.play).toHaveBeenCalledTimes(2)
    expect(videoEl.src).toBe('http://localhost/stream?attempt=2')
  })
})

describe('playWhenReady', () => {
  it('plays immediately when media is already buffered', async () => {
    const videoEl = {
      readyState: 4,
      play: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    await playWhenReady(videoEl)
    expect(videoEl.play).toHaveBeenCalledTimes(1)
  })
})
