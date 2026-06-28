import {describe, it, expect} from 'vitest'
import {buildLiveStreamUrl, buildVideoStreamUrl} from '@/services/transcodeService'

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
