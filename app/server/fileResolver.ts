import type { ServerConfig } from '../types/server'
const path = require('path')
const fs = require('fs')
const {normalizeMediaPath} = require('../../api/utils/normalizeUserPath')
const {pathVariants} = require('../../api/services/contentHash')
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

function createFileResolver({config, databasesPath}: FileResolverOptions) {
  function resolveFilePath(filePath: string | null | undefined): string | null {
    if (!filePath) return null

    console.log('Resolving file path:', filePath)

    const normalizedPath = normalizeMediaPath(filePath)

    for (const variant of pathVariants(normalizedPath)) {
      if (fs.existsSync(variant)) {
        return variant
      }
    }

    if (path.isAbsolute(normalizedPath)) {
      if (fs.existsSync(normalizedPath)) {
        return normalizedPath
      }

      const dbIdRegex = /(?:databases|app_storage)[\\/]+([a-f0-9]{12})/i
      const match = normalizedPath.match(dbIdRegex)

      if (match) {
        const dbIdInPath = match[1]
        const dbExists = config.databases.find(db => db.id === dbIdInPath)

        if (dbExists) {
          console.log(`Database in path exists: ${dbIdInPath}, but file not found`)
        }
      }
    }

    const activeDb = config.databases.find(db => db.active)
    if (activeDb) {
      const cleanPath = normalizedPath
        .replace(/^\/+/, '')
        .replace(/^.*(?:databases|app_storage)[\\/]+[a-f0-9]{12}[\\/]+/i, '')

      const possiblePaths = [
        path.join(databasesPath, activeDb.id, 'media', cleanPath),
        path.join(databasesPath, activeDb.id, cleanPath),
        path.join(databasesPath, activeDb.id, 'meta', cleanPath),
      ]

      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          console.log(`File found at path: ${possiblePath}`)
          return possiblePath
        }
      }
    }

    for (const db of config.databases) {
      const cleanPath = normalizedPath
        .replace(/^\/+/, '')
        .replace(/^.*(?:databases|app_storage)[\\/]+[a-f0-9]{12}[\\/]+/i, '')

      const possiblePaths = [
        path.join(databasesPath, db.id, 'media', cleanPath),
        path.join(databasesPath, db.id, cleanPath),
        path.join(databasesPath, db.id, 'meta', cleanPath),
      ]

      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          console.log(`File found in database ${db.name} (${db.id}): ${possiblePath}`)
          return possiblePath
        }
      }
    }

    console.log(`File not found: ${normalizedPath}`)
    return null
  }

  return {
    resolveFilePath,
    getStreamContentType,
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
}
