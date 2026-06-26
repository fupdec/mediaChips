import {describe, it, expect} from 'vitest'
import {
  createShuffledPlaylistIndexes,
  promotePlaylistIndex,
  shouldSkipShuffleReshuffle,
} from '@/composable/playerPlaylist'

describe('playerPlaylist', () => {
  it('skips reshuffle when shuffle mode is turned off', () => {
    expect(shouldSkipShuffleReshuffle(['loop'], ['shuffle'])).toBe(true)
    expect(shouldSkipShuffleReshuffle(['shuffle', 'loop'], ['shuffle'])).toBe(false)
  })

  it('creates shuffled playlist indexes', () => {
    const indexes = createShuffledPlaylistIndexes(4)
    expect(indexes).toHaveLength(4)
    expect(indexes.sort()).toEqual([0, 1, 2, 3])
  })

  it('promotes selected index to front of shuffle order', () => {
    expect(promotePlaylistIndex([2, 0, 1], 1)).toEqual([1, 2, 0])
    expect(promotePlaylistIndex([0, 1, 2], 0)).toEqual([0, 1, 2])
  })
})
