const LIVE_STREAM_CHUNK_SECONDS = 30
const LIVE_STREAM_PREFETCH_SECONDS = 8

function getChunkStart(time, chunkDuration = LIVE_STREAM_CHUNK_SECONDS) {
  const seconds = Math.max(0, Number(time) || 0)
  return Math.floor(seconds / chunkDuration) * chunkDuration
}

function getChunkDuration({
  chunkStart,
  fileDuration,
  chunkDuration = LIVE_STREAM_CHUNK_SECONDS,
}) {
  if (!fileDuration || fileDuration <= chunkStart) {
    return chunkDuration
  }

  return Math.min(chunkDuration, Math.max(0, fileDuration - chunkStart))
}

function getNextChunkStart(chunkStart, fileDuration, chunkDuration = LIVE_STREAM_CHUNK_SECONDS) {
  const next = chunkStart + chunkDuration
  if (!fileDuration || next >= fileDuration - 0.25) {
    return null
  }

  return next
}

module.exports = {
  LIVE_STREAM_CHUNK_SECONDS,
  LIVE_STREAM_PREFETCH_SECONDS,
  getChunkStart,
  getChunkDuration,
  getNextChunkStart,
}
