import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

const {computeContentHashForPath, resolveExistingPath} = require('./contentHash')

async function getContentHashBackfillStatus(db: ApiDb) {
  const Op = db.Sequelize.Op
  const total = await db.Media.count()
  const pending = await db.Media.count({
    where: {
      [Op.or]: [
        {contentHash: null},
        {contentHash: ''},
      ],
    },
  })

  return {
    total,
    pending,
    hashed: total - pending,
  }
}

async function backfillMediaContentHash(db: ApiDb, media: AnyRecord) {
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

    await db.Media.update(
      {contentHash},
      {where: {id: media.id}},
    )

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

async function* iterateContentHashBackfill(db: ApiDb, {shouldStop = () => false, force = false} = {}) {
  const Op = db.Sequelize.Op
  const where = force
    ? {}
    : {
      [Op.or]: [
        {contentHash: null},
        {contentHash: ''},
      ],
    }

  const total = await db.Media.count({where})

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
    const media = await db.Media.findOne({
      where: {
        ...where,
        id: {[Op.gt]: lastId},
      },
      order: [['id', 'ASC']],
      raw: true,
    })

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
