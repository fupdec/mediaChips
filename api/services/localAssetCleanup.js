const fs = require('fs')
const path = require('path')
const {readdir} = require('fs/promises')
const {resolveExistingPath} = require('./contentHash')
const {getMediaDeleteAssetFolder} = require('../utils/mediaType')

const TIMELINE_PARTS = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
const TAG_IMAGE_SUFFIXES = ['main', 'avatar', 'alt', 'header', 'custom1', 'custom2']

function unlinkIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false

  fs.unlinkSync(filePath)
  return true
}

async function unlinkResolvedPath(filePath) {
  const resolvedPath = await resolveExistingPath(filePath)
  if (!resolvedPath) return false

  await fs.promises.unlink(resolvedPath)
  return true
}

function deleteVideoGeneratedAssets(dbPath, mediaId, markIds = []) {
  const mediaPath = path.join(dbPath, 'media/videos')

  unlinkIfExists(path.join(mediaPath, 'thumbs', `${mediaId}.jpg`))
  unlinkIfExists(path.join(mediaPath, 'grids', `${mediaId}.jpg`))

  for (const part of TIMELINE_PARTS) {
    unlinkIfExists(path.join(mediaPath, 'timelines', `${mediaId}_${part}.jpg`))
  }

  for (const markId of markIds) {
    deleteMarkGeneratedAsset(dbPath, markId)
  }
}

function deleteImageGeneratedAssets(dbPath, mediaId) {
  unlinkIfExists(path.join(dbPath, 'media/images/thumbs', `${mediaId}.jpg`))
}

function deleteMarkGeneratedAsset(dbPath, markId) {
  unlinkIfExists(path.join(dbPath, 'media/videos/marks', `${markId}.jpg`))
}

async function deleteTagGeneratedAssets(dbPath, metaId, tagId) {
  if (!metaId || !tagId) return

  const metaPath = path.join(dbPath, 'meta', String(metaId))
  const prefix = `${tagId}_`
  const deleted = new Set()

  if (fs.existsSync(metaPath)) {
    const files = await readdir(metaPath)

    for (const file of files) {
      if (!file.startsWith(prefix)) continue
      if (!/\.(jpg|jpeg|png|webp)$/i.test(file)) continue

      const filePath = path.join(metaPath, file)
      if (unlinkIfExists(filePath)) {
        deleted.add(file)
      }
    }
  }

  for (const suffix of TAG_IMAGE_SUFFIXES) {
    const fileName = `${tagId}_${suffix}.jpg`
    if (deleted.has(fileName)) continue
    unlinkIfExists(path.join(metaPath, fileName))
  }
}

async function deleteMediaGeneratedAssets(db, dbPath, media, mediaType) {
  const assetFolder = getMediaDeleteAssetFolder(mediaType)

  if (assetFolder === 'videos') {
    const marks = await db.Mark.findAll({
      where: {mediaId: media.id},
      attributes: ['id'],
      raw: true,
    })

    deleteVideoGeneratedAssets(
      dbPath,
      media.id,
      marks.map((mark) => mark.id),
    )
    return
  }

  if (assetFolder === 'images') {
    deleteImageGeneratedAssets(dbPath, media.id)
  }
}

module.exports = {
  deleteVideoGeneratedAssets,
  deleteImageGeneratedAssets,
  deleteMarkGeneratedAsset,
  deleteTagGeneratedAssets,
  deleteMediaGeneratedAssets,
  unlinkIfExists,
  unlinkResolvedPath,
}
