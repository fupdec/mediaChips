import {describe, it, expect, vi} from 'vitest'
import {resolvePlayableVideo, isLoadSrcSessionStale} from '@/composable/usePlayerPlayback'

describe('isLoadSrcSessionStale', () => {
  it('detects stale session id', () => {
    expect(isLoadSrcSessionStale(1, 2, true)).toBe(true)
    expect(isLoadSrcSessionStale(2, 2, true)).toBe(false)
  })

  it('detects inactive player', () => {
    expect(isLoadSrcSessionStale(2, 2, false)).toBe(true)
  })
})

describe('resolvePlayableVideo', () => {
  const playlist = [
    {id: 1, path: '/missing.mp4'},
    {id: 2, path: '/available.mp4'},
  ]

  it('returns first playable file from playlist', async () => {
    const checkFileExists = vi.fn(async (filePath) => filePath === '/available.mp4')

    await expect(resolvePlayableVideo(playlist, playlist[0], checkFileExists))
      .resolves.toEqual({video: playlist[1], index: 1})
  })

  it('falls back to initial video when no file exists on disk', async () => {
    const checkFileExists = vi.fn(async () => false)

    await expect(resolvePlayableVideo(playlist, playlist[0], checkFileExists))
      .resolves.toEqual({video: playlist[0], index: 0})
  })

  it('returns null without initial video id', async () => {
    const checkFileExists = vi.fn(async () => false)

    await expect(resolvePlayableVideo([], {}, checkFileExists)).resolves.toBeNull()
  })
})
