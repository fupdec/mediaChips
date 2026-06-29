import type { ApiDb, AnyRecord } from '../types/db'

const {createMarksRepository} = require('../db/repositories/marks')

async function getRandomMarks(db: ApiDb, limit = 8) {
  const marksRepo = createMarksRepository(db.drizzle)
  const total = marksRepo.countAll()
  if (!total) return []

  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 16, total)
  const marks = marksRepo.findRandomWithRelations(safeLimit)

  return marks.map((mark: AnyRecord) => {
    const json = {...mark} as AnyRecord

    if (json.media && !json.medium) {
      json.medium = json.media
    }

    return json
  })
}

module.exports = {
  getRandomMarks,
}
