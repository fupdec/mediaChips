import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

const path = require('path')
const fs = require('fs')
const {normalizeMediaPath} = require('../utils/normalizeUserPath')
const {pathVariants} = require('./contentHash')

function resolveActiveDbFilePath(filePath: string | null | undefined, dbPath: string | null | undefined) {
  if (!filePath) return null

  const normalizedPath = normalizeMediaPath(filePath)

  for (const variant of pathVariants(normalizedPath)) {
    if (fs.existsSync(variant)) return variant
  }

  if (path.isAbsolute(normalizedPath) && fs.existsSync(normalizedPath)) {
    return normalizedPath
  }

  if (!dbPath) return null

  const cleanPath = normalizedPath
    .replace(/^\/+/, '')
    .replace(/^.*(?:databases|app_storage)[\\/]+[a-f0-9]{12}[\\/]+/i, '')

  const possiblePaths = [
    path.join(dbPath, 'media', cleanPath),
    path.join(dbPath, cleanPath),
    path.join(dbPath, 'meta', cleanPath),
    path.join(dbPath, 'media', normalizedPath),
    path.join(dbPath, normalizedPath),
  ]

  for (const possiblePath of possiblePaths) {
    for (const variant of pathVariants(possiblePath)) {
      if (fs.existsSync(variant)) return variant
    }
  }

  return null
}

export {resolveActiveDbFilePath}

module.exports = {
  resolveActiveDbFilePath,
}
