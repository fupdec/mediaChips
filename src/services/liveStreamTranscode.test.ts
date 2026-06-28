import {describe, it, expect} from 'vitest'
import {
  buildSessionKey,
  shouldRejectDuplicateStream,
} from '../../api/services/transcode/liveStreamTranscode.js'

type BuildSessionKey = (streamKey: string, startTime: number, maxHeight?: number | null) => string
const buildKey = buildSessionKey as BuildSessionKey

describe('liveStreamTranscode session keys', () => {
  it('includes start time and max height in the session key', () => {
    expect(buildKey('abc123', 120, 720)).toBe('abc123@120.00@720')
  })

  it('uses distinct keys for different quality at the same chunk', () => {
    const streamKey = 'file-hash'
    const start = 240

    expect(buildKey(streamKey, start, 1080)).not.toBe(
      buildKey(streamKey, start, 720),
    )
  })

  it('uses auto height marker when max height is omitted', () => {
    expect(buildSessionKey('abc123', 0)).toBe('abc123@0.00@auto')
  })
})

describe('shouldRejectDuplicateStream', () => {
  it('rejects duplicate stream within 5 seconds', () => {
    const now = 10_000
    expect(shouldRejectDuplicateStream({startedAt: 6_500, stopped: false}, now)).toBe(true)
  })

  it('allows a new stream after 5 seconds', () => {
    const now = 10_000
    expect(shouldRejectDuplicateStream({startedAt: 4_000, stopped: false}, now)).toBe(false)
  })

  it('ignores stopped streams', () => {
    expect(shouldRejectDuplicateStream({startedAt: 9_999, stopped: true}, 10_000)).toBe(false)
  })
})
