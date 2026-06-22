const {getContentHashBackfillStatus} = require('./contentHashBackfill')

async function getDuplicateCounts(db) {
  const [[byFilesize]] = await db.sequelize.query(`
    SELECT COUNT(*) AS count
    FROM media m
    WHERE m.filesize > 0
      AND EXISTS (
        SELECT 1
        FROM media m2
        WHERE m2.id != m.id
          AND m2.filesize = m.filesize
      )
  `)

  const [[byContentHash]] = await db.sequelize.query(`
    SELECT COUNT(*) AS count
    FROM media m
    WHERE m.contentHash IS NOT NULL
      AND m.contentHash != ''
      AND EXISTS (
        SELECT 1
        FROM media m2
        WHERE m2.id != m.id
          AND m2.contentHash = m.contentHash
      )
  `)

  return {
    byFilesize: Number(byFilesize?.count || 0),
    byContentHash: Number(byContentHash?.count || 0),
  }
}

async function getHomeHealth(db) {
  const [duplicates, contentHash] = await Promise.all([
    getDuplicateCounts(db),
    getContentHashBackfillStatus(db),
  ])

  return {
    duplicates,
    contentHash,
  }
}

module.exports = {
  getHomeHealth,
  getDuplicateCounts,
}
