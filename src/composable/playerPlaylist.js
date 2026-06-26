import _ from 'lodash'

export function shouldSkipShuffleReshuffle(newMode, oldMode) {
  return !newMode.includes('shuffle') && oldMode.includes('shuffle')
}

export function createShuffledPlaylistIndexes(length) {
  return _.shuffle(Array.from({length}, (_, index) => index))
}

export function promotePlaylistIndex(shuffle, index) {
  const next = [...shuffle]
  const position = next.indexOf(index)

  if (position === -1) {
    return next
  }

  next.splice(position, 1)
  next.unshift(index)
  return next
}
