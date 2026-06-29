import type { ServerConfig } from '../types/server'
const path = require('path')
const fs = require('fs')
const {normalizeMediaPath} = require('../../api/utils/normalizeUserPath')
const {pathVariants} = require('../../api/services/contentHash')
const {
  getCachedResolvedPath,
  setCachedResolvedPath,
  clearResolvedPathCache,
} = require('./resolvePathCache')
import type { Request, Response } from 'express'

const STREAM_MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.ogg': 'audio/ogg',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.opus': 'audio/opus',
  '.wma': 'audio/x-ms-wma',
}

function getStreamContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase() as keyof typeof STREAM_MIME_TYPES
  return STREAM_MIME_TYPES[ext] || 'application/octet-stream'
}

interface FileResolverOptions {
  config: ServerConfig
  databasesPath: string
}

function resolveExistingPath(candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

function buildDbRelativeCandidates(
  databasesPath: string,
  dbId: string,
  normalizedPath: string,
): string[] {
  const cleanPath = normalizedPath
    .replace(/^\/+/, '')
    .replace(/^.*(?:databases|app_storage)[\\/]+[a-f0-9]{12}[\\/]+/i, '')

  return [
    path.join(databasesPath, dbId, 'media', cleanPath),
    path.join(databasesPath, dbId, cleanPath),
    path.join(databasesPath, dbId, 'meta', cleanPath),
  ]
}

function createFileResolver({config, databasesPath}: FileResolverOptions) {
  function resolveFilePathUncached(filePath: string): string | null {
    const normalizedPath = normalizeMediaPath(filePath)

    const directMatch = resolveExistingPath(pathVariants(normalizedPath))
    if (directMatch) {
      return directMatch
    }

    if (path.isAbsolute(normalizedPath) && fs.existsSync(normalizedPath)) {
      return normalizedPath
    }

    const activeDb = config.databases.find(db => db.active)
    if (activeDb) {
      const activeMatch = resolveExistingPath(
        buildDbRelativeCandidates(databasesPath, activeDb.id, normalizedPath),
      )
      if (activeMatch) {
        return activeMatch
      }
    }

    for (const db of config.databases) {
      const dbMatch = resolveExistingPath(
        buildDbRelativeCandidates(databasesPath, db.id, normalizedPath),
      )
      if (dbMatch) {
        return dbMatch
      }
    }

    return null
  }

  function resolveFilePath(filePath: string | null | undefined): string | null {
    if (!filePath) return null

    const cacheKey = normalizeMediaPath(filePath)
    const cached = getCachedResolvedPath(cacheKey)
    if (cached) {
      return cached
    }

    const resolved = resolveFilePathUncached(filePath)
    if (resolved) {
      setCachedResolvedPath(cacheKey, resolved)
    }

    return resolved
  }

  return {
    resolveFilePath,
    getStreamContentType,
    clearResolvedPathCache,
  }
}

function isClientAbortError(err: NodeJS.ErrnoException | null | undefined): boolean {
  const code = err?.code
  return code === 'ECONNABORTED'
    || code === 'ECONNRESET'
    || code === 'EPIPE'
    || code === 'ERR_STREAM_WRITE_AFTER_END'
    || err?.message === 'Request aborted'
}

function safeJsonError(
  res: Response,
  req: Request,
  status: number,
  payload: Record<string, unknown>,
): void {
  if (req.aborted || res.writableEnded || res.headersSent) return
  res.status(status).json(payload)
}

module.exports = {
  createFileResolver,
  isClientAbortError,
  safeJsonError,
  clearResolvedPathCache,
}
