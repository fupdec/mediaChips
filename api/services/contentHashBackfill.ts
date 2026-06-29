import type { ApiDb } from '../types/db'
import { computeContentHashForPath, resolveExistingPath } from './contentHash'
import { createMediaRepository } from '../db/repositories/media'

async function getContentHashBackfillStatus(db: ApiDb) {
  const mediaRepo = createMediaRepository(db.drizzle)
  const total = mediaRepo.countAll()
  const pending = mediaRepo.countPendingContentHash()

  return {
    total,
    pending,
    hashed: total - pending,
  }
}

async function backfillMediaContentHash(db: ApiDb, media: {id: unknown; path?: unknown}) {
  const mediaRepo = createMediaRepository(db.drizzle)
  const mediaPath = String(media.path || '')
  const resolvedPath = await resolveExistingPath(mediaPath)

  if (!resolvedPath) {
    return {
      status: 'missing',
      id: media.id,
      path: mediaPath,
    }
  }

  try {
    const contentHash = await computeContentHashForPath(mediaPath)
    mediaRepo.updateById(Number(media.id), {contentHash})

    return {
      status: 'hashed',
      id: media.id,
      path: mediaPath,
    }
  } catch (error: unknown) {
    return {
      status: 'failed',
      id: media.id,
      path: mediaPath,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

async function* iterateContentHashBackfill(
  db: ApiDb,
  {shouldStop = (): boolean => false, force = false}: {shouldStop?: () => boolean; force?: boolean} = {},
) {
  const mediaRepo = createMediaRepository(db.drizzle)
  const total = mediaRepo.countForBackfill(force)

  let processed = 0
  let hashed = 0
  let missing = 0
  let failed = 0
  let lastId = 0

  yield {
    type: 'progress',
    processed,
    total,
    remaining: total,
    hashed,
    missing,
    failed,
  }

  while (!shouldStop()) {
    const media = mediaRepo.findNextForBackfill(lastId, force)

    if (!media) break

    lastId = Number(media.id)
    const result = await backfillMediaContentHash(db, media)
    processed += 1

    if (result.status === 'hashed') hashed += 1
    else if (result.status === 'missing') missing += 1
    else failed += 1

    yield {
      type: 'progress',
      processed,
      total,
      remaining: Math.max(total - processed, 0),
      hashed,
      missing,
      failed,
      current: result.path,
      lastStatus: result.status,
    }
  }

  yield {
    type: 'complete',
    processed,
    total,
    hashed,
    missing,
    failed,
    stopped: shouldStop(),
  }
}

module.exports = {
  getContentHashBackfillStatus,
  backfillMediaContentHash,
  iterateContentHashBackfill,
}

export { getContentHashBackfillStatus, backfillMediaContentHash, iterateContentHashBackfill }
