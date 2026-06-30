import shuffle from 'lodash/shuffle'

export function shouldSkipShuffleReshuffle(newMode: string[], oldMode: string[]) {
  return !newMode.includes('shuffle') && oldMode.includes('shuffle')
}

export function createShuffledPlaylistIndexes(length: number) {
  return shuffle(Array.from({ length }, (_, index) => index))
}

export function promotePlaylistIndex(shuffle: number[], index: number) {
  const next = [...shuffle]
  const position = next.indexOf(index)

  if (position === -1) {
    return next
  }

  next.splice(position, 1)
  next.unshift(index)
  return next
}
