export const LIVE_STREAM_CHUNK_SECONDS = 30
export const LIVE_STREAM_PREFETCH_SECONDS = 8

export function getChunkStart(time: number, chunkDuration = LIVE_STREAM_CHUNK_SECONDS): number {
  const seconds = Math.max(0, Number(time) || 0)
  return Math.floor(seconds / chunkDuration) * chunkDuration
}

export function getChunkDuration({
  chunkStart,
  fileDuration,
  chunkDuration = LIVE_STREAM_CHUNK_SECONDS,
}: {
  chunkStart: number
  fileDuration?: number | null
  chunkDuration?: number
}): number {
  if (!fileDuration || fileDuration <= chunkStart) {
    return chunkDuration
  }

  return Math.min(chunkDuration, Math.max(0, fileDuration - chunkStart))
}

export function getNextChunkStart(
  chunkStart: number,
  fileDuration: number | null | undefined,
  chunkDuration = LIVE_STREAM_CHUNK_SECONDS,
): number | null {
  const next = chunkStart + chunkDuration
  if (!fileDuration || next >= fileDuration - 0.25) {
    return null
  }

  return next
}
