import type { ApiDb, AnyRecord } from '../types/db'
import type { ParsedHomeHealth } from '@shared/schemas/home'

const fs = require('fs')
const path = require('path')
const {readdir, stat} = require('fs/promises')
const {getContentHashBackfillStatus} = require('./contentHashBackfill')
const {getVideoImagesGenerationStatus} = require('./videoImagesGeneration')
const {getImageThumbsGenerationStatus} = require('./imageThumbsGeneration')
const {queryGet} = require('../db/utils/rawQuery')

async function getDirectorySize(directory: string) {
  if (!fs.existsSync(directory)) return 0

  const entries = await readdir(directory, {withFileTypes: true})
  const sizes = await Promise.all(entries.map(async (entry: import("fs").Dirent) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return getDirectorySize(entryPath)
    if (entry.isFile()) {
      const {size} = await stat(entryPath)
      return size
    }
    return 0
  }))

  return sizes.reduce((sum: number, size: number) => sum + size, 0)
}

async function getActiveDatabaseSize(db: ApiDb) {
  const bytes = await getDirectorySize(db.path ?? '')

  return {
    id: db.config?.id || null,
    name: db.config?.name || null,
    bytes,
  }
}

function summarizeGeneratedImagesStatus(status: unknown) {
  const byType = status || {}
  const totalPending = (Object.values(byType) as AnyRecord[]).reduce(
    (sum: number, item: AnyRecord) => sum + Number(item?.pending || 0),
    0,
  )

  return {byType, totalPending}
}

async function getDuplicateCounts(db: ApiDb) {
  const byFilesize = queryGet(db, `
    SELECT COUNT(*) AS count
    FROM media m
    WHERE m.filesize > 0
      AND EXISTS (
        SELECT 1
        FROM media m2
        WHERE m2.id != m.id
          AND m2.filesize = m.filesize
      )
  `) as {count?: number} | undefined

  const byContentHash = queryGet(db, `
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
  `) as {count?: number} | undefined

  return {
    byFilesize: Number(byFilesize?.count || 0),
    byContentHash: Number(byContentHash?.count || 0),
  }
}

async function getHomeHealth(db: ApiDb): Promise<ParsedHomeHealth> {
  const dbPath = db.path
  const [duplicates, contentHash, videoImages, imageThumbs, database] = await Promise.all([
    getDuplicateCounts(db),
    getContentHashBackfillStatus(db),
    getVideoImagesGenerationStatus(db, dbPath),
    getImageThumbsGenerationStatus(db, dbPath),
    getActiveDatabaseSize(db),
  ])

  const generatedImages = summarizeGeneratedImagesStatus({
    ...videoImages,
    'image-thumbs': imageThumbs,
  })

  return {
    duplicates,
    contentHash,
    generatedImages,
    imageThumbs,
    database,
  } as ParsedHomeHealth
}

module.exports = {
  getHomeHealth,
  getDuplicateCounts,
}
