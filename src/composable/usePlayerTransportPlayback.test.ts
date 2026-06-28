import {describe, it, expect} from 'vitest'
import {
  isPlaylistNavDisabled,
  resolvePlaylistIndex,
} from '@/composable/usePlayerTransportPlayback'

const base = {
  playlistMode: [],
  playlistShuffle: [2, 0, 1],
  nowPlaying: 1,
  playlistLength: 3,
}

describe('isPlaylistNavDisabled', () => {
  it('disables prev at first item without loop', () => {
    expect(isPlaylistNavDisabled({
      ...base,
      nowPlaying: 0,
      direction: 'prev',
    })).toBe(true)
  })

  it('allows prev with loop mode', () => {
    expect(isPlaylistNavDisabled({
      ...base,
      playlistMode: ['loop'],
      nowPlaying: 0,
      direction: 'prev',
    })).toBe(false)
  })

  it('disables next at last shuffle item without loop', () => {
    expect(isPlaylistNavDisabled({
      ...base,
      playlistMode: ['shuffle'],
      playlistShuffle: [2, 0, 1],
      nowPlaying: 1,
      direction: 'next',
    })).toBe(true)
  })
})

describe('resolvePlaylistIndex', () => {
  it('moves to next sequential index', () => {
    expect(resolvePlaylistIndex({
      ...base,
      nowPlaying: 1,
      direction: 'next',
    })).toBe(2)
  })

  it('wraps to end with loop on prev from first item', () => {
    expect(resolvePlaylistIndex({
      ...base,
      playlistMode: ['loop'],
      nowPlaying: 0,
      direction: 'prev',
    })).toBe(2)
  })

  it('follows shuffle order on next', () => {
    expect(resolvePlaylistIndex({
      ...base,
      playlistMode: ['shuffle'],
      playlistShuffle: [2, 0, 1],
      nowPlaying: 0,
      direction: 'next',
    })).toBe(1)
  })
})
