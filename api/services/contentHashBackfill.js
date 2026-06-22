const {computeContentHash, fileExists} = require('./contentHash')

async function getContentHashBackfillStatus(db) {
  const total = await db.Media.count()
  const pending = await db.Media.count({
    where: {contentHash: null},
  })

  return {
    total,
    pending,
    hashed: total - pending,
  }
}

async function backfillMediaContentHash(db, media) {
  const exists = await fileExists(media.path)

  if (!exists) {
    return {
      status: 'missing',
      id: media.id,
      path: media.path,
    }
  }

  try {
    const contentHash = await computeContentHash(media.path)

    await db.Media.update(
      {contentHash},
      {where: {id: media.id}},
    )

    return {
      status: 'hashed',
      id: media.id,
      path: media.path,
    }
  } catch (error) {
    return {
      status: 'failed',
      id: media.id,
      path: media.path,
      message: error.message,
    }
  }
}

async function* iterateContentHashBackfill(db, {shouldStop = () => false} = {}) {
  const total = await db.Media.count({
    where: {contentHash: null},
  })

  let processed = 0
  let hashed = 0
  let missing = 0
  let failed = 0

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
    const media = await db.Media.findOne({
      where: {contentHash: null},
      order: [['id', 'ASC']],
      raw: true,
    })

    if (!media) break

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
