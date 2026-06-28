import type { ApiDb, SequelizeInstance, AnyRecord } from '../types/db'

async function getRandomMarks(db: ApiDb, limit = 8) {
  const total = await db.Mark.count()
  if (!total) return []

  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 16, total)

  const marks = await db.Mark.findAll({
    include: [{
      model: db.Tag,
      include: [{
        model: db.Meta,
      }],
    }, db.Media],
    order: db.sequelize.random(),
    limit: safeLimit,
  })

  return marks.map((mark: SequelizeInstance) => {
    const json = (mark.toJSON?.() ?? mark) as AnyRecord

    if (json.media && !json.medium) {
      json.medium = json.media
    }

    return json
  })
}

module.exports = {
  getRandomMarks,
}
