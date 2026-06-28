import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

const crypto = require('crypto')
const fs = require('fs')
const {access} = require('fs/promises')

const pathVariants = (pathToFile: any) => {
  const variants = new Set()

  if (typeof pathToFile !== 'string' || !pathToFile) {
    return []
  }

  variants.add(pathToFile)

  if (typeof pathToFile.normalize === 'function') {
    variants.add(pathToFile.normalize('NFC'))
    variants.add(pathToFile.normalize('NFD'))
  }

  return [...variants]
}

const resolveExistingPath = async (pathToFile: any) => {
  for (const variant of pathVariants(pathToFile)) {
    try {
      await access(variant, fs.constants.F_OK)
      return variant
    } catch {
      // try next variant
    }
  }

  return null
}

const fileExists = async (pathToFile: any) => Boolean(await resolveExistingPath(pathToFile))

const computeContentHash = (pathToFile: any) => new Promise((resolve, reject) => {
  const hash = crypto.createHash('sha256')
  const stream = fs.createReadStream(pathToFile)

  stream.on('data', (chunk: any) => hash.update(chunk))
  stream.on('end', () => resolve(hash.digest('hex')))
  stream.on('error', reject)
})

const computeContentHashForPath = async (pathToFile: any) => {
  const resolvedPath = await resolveExistingPath(pathToFile)

  if (!resolvedPath) {
    throw new Error(`File not found: ${pathToFile}`)
  }

  return computeContentHash(resolvedPath)
}

const verifyContentHashMatch = async (pathToFile: any, expectedHash: any) => {
  try {
    const actualHash = await computeContentHashForPath(pathToFile)
    return actualHash === expectedHash
  } catch {
    return false
  }
}

module.exports = {
  computeContentHash,
  computeContentHashForPath,
  verifyContentHashMatch,
  fileExists,
  resolveExistingPath,
  pathVariants,
}
