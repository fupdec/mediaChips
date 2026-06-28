import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

const path = require('path')
const {readdir, stat} = require('fs/promises')
const {computeContentHash, fileExists} = require('./contentHash')

async function loadMissingMedia(db: ApiDb, options: Record<string, any> = {}) {
  const {shouldStop = () => false, onProgress} = options
  const all = await db.Media.findAll({
    raw: true,
    order: [['id', 'ASC']],
  })

  const missing = []

  for (let index = 0; index < all.length; index += 1) {
    if (shouldStop()) break

    const item = all[index]
    if (!(await fileExists(item.path))) {
      missing.push(item)
    }

    if (onProgress && (index % 100 === 0 || index === all.length - 1)) {
      onProgress(index + 1, all.length)
    }
  }

  return missing
}

async function getMissingMediaStatus(db: ApiDb) {
  const missing = await loadMissingMedia(db)

  return {
    total: await db.Media.count(),
    missing: missing.length,
    withHash: missing.filter((item: any) => item.contentHash).length,
    withoutHash: missing.filter((item: any) => !item.contentHash).length,
  }
}

function buildExtensionRegex(mediaTypes: any) {
  const extensions = new Set()

  for (const mediaType of mediaTypes) {
    String(mediaType.extensions || '')
      .split(',')
      .map((ext: any) => ext.trim().toLowerCase())
      .filter(Boolean)
      .forEach((ext: any) => extensions.add(ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  if (!extensions.size) {
    return /\.[^./\\]+$/i
  }

  return new RegExp(`\\.(${Array.from(extensions).join('|')})$`, 'i')
}

async function* walkMediaFiles(rootDirs: any, {extensionRegex, shouldStop = () => false}: {extensionRegex: any; shouldStop?: () => boolean}) {
  const stack = [...rootDirs]
  let scanned = 0

  while (stack.length && !shouldStop()) {
    const dir = stack.pop()
    let entries

    try {
      entries = await readdir(dir, {withFileTypes: true})
    } catch {
      continue
    }

    for (const entry of entries) {
      if (shouldStop()) return

      const filePath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        stack.push(filePath)
      } else if (entry.isFile() && extensionRegex.test(filePath)) {
        scanned += 1
        yield {path: filePath, scanned}

        if (scanned % 200 === 0) {
          await new Promise((resolve) => setImmediate(resolve))
        }
      }
    }
  }
}

function buildMissingIndexes(missingMedia: any) {
  const byHash = new Map()
  const bySizeNoHash = new Map()
  const targetSizes = new Set()

  for (const item of missingMedia) {
    const size = Number(item.filesize) || 0
    targetSizes.add(size)

    if (item.contentHash) {
      if (!byHash.has(item.contentHash)) {
        byHash.set(item.contentHash, [])
      }
      byHash.get(item.contentHash).push(item)
      continue
    }

    if (!bySizeNoHash.has(size)) {
      bySizeNoHash.set(size, [])
    }
    bySizeNoHash.get(size).push(item)
  }

  return {byHash, bySizeNoHash, targetSizes}
}

function pickWeakCandidate(candidates: AnyRecord[], foundPath: any) {
  if (!candidates.length) return null
  if (candidates.length === 1) return candidates[0]

  const foundBasename = path.basename(foundPath).toLowerCase()
  const basenameMatches = candidates.filter(
    (item) => path.basename(item.path).toLowerCase() === foundBasename,
  )

  if (basenameMatches.length === 1) {
    return basenameMatches[0]
  }

  return null
}

async function* iterateMissingMediaSearch(db: ApiDb, options: Record<string, any> = {}) {
  const {
    folders = [],
    shouldStop = () => false,
  } = options

  const rootDirs = folders
    .map((folder: any) => path.resolve(String(folder)))
    .filter(Boolean)

  if (!rootDirs.length) {
    yield {type: 'error', message: 'No folders provided'}
    return
  }

  yield {type: 'phase', phase: 'loading_missing'}

  const allMedia = await db.Media.findAll({
    raw: true,
    order: [['id', 'ASC']],
  })

  const missingMedia = []

  for (let index = 0; index < allMedia.length; index += 1) {
    if (shouldStop()) break

    const item = allMedia[index]

    if (!(await fileExists(item.path))) {
      missingMedia.push(item)
    }

    if (index % 100 === 0 || index === allMedia.length - 1) {
      yield {
        type: 'progress',
        phase: 'loading_missing',
        processed: index + 1,
        total: allMedia.length,
        missing: missingMedia.length,
        matched: 0,
      }
    }
  }

  if (shouldStop()) {
    yield {
      type: 'complete',
      scanned: 0,
      matched: 0,
      matches: [],
      missing: missingMedia.length,
      stopped: true,
    }
    return
  }

  if (!missingMedia.length) {
    yield {
      type: 'complete',
      scanned: 0,
      matched: 0,
      matches: [],
      missing: 0,
    }
    return
  }

  const {byHash, bySizeNoHash, targetSizes} = buildMissingIndexes(missingMedia)
  const mediaTypes = await db.MediaType.findAll({raw: true})
  const extensionRegex = buildExtensionRegex(mediaTypes)
  const knownPaths = new Set(
    (await db.Media.findAll({attributes: ['path'], raw: true}))
      .map((item: any) => item.path.toLowerCase()),
  )

  const matchedMediaIds = new Set()
  const matches = []
  let scanned = 0
  let sizeMatched = 0

  yield {
    type: 'progress',
    phase: 'scanning',
    scanned,
    missing: missingMedia.length,
    matched: 0,
    current: rootDirs[0],
  }

  for await (const {path: filePath} of walkMediaFiles(rootDirs, {extensionRegex, shouldStop})) {
    if (shouldStop()) break

    scanned += 1

    if (knownPaths.has(filePath.toLowerCase())) {
      if (scanned % 100 === 0) {
        yield {
          type: 'progress',
          phase: 'scanning',
          scanned,
          sizeMatched,
          missing: missingMedia.length,
          matched: matches.length,
          current: filePath,
        }
      }
      continue
    }

    let fileStat

    try {
      fileStat = await stat(filePath)
    } catch {
      continue
    }

    const filesize = fileStat.size

    if (!targetSizes.has(filesize)) {
      if (scanned % 100 === 0) {
        yield {
          type: 'progress',
          phase: 'scanning',
          scanned,
          sizeMatched,
          missing: missingMedia.length,
          matched: matches.length,
          current: filePath,
        }
      }
      continue
    }

    sizeMatched += 1

    let contentHash = null

    try {
      contentHash = await computeContentHash(filePath)
    } catch {
      continue
    }

    let match = null
    let confidence = null

    if (byHash.has(contentHash)) {
      const candidates = byHash.get(contentHash)
        .filter((item: any) => !matchedMediaIds.has(item.id))
      if (candidates.length === 1) {
        match = candidates[0]
        confidence = 'hash'
      } else if (candidates.length > 1) {
        const weak = pickWeakCandidate(candidates, filePath)
        if (weak) {
          match = weak
          confidence = 'hash'
        }
      }
    } else {
      const candidates = (bySizeNoHash.get(filesize) || [])
        .filter((item: any) => !matchedMediaIds.has(item.id))
      const weak = pickWeakCandidate(candidates, filePath)

      if (weak) {
        match = weak
        confidence = 'size'
      }
    }

    if (match && !matchedMediaIds.has(match.id)) {
      matchedMediaIds.add(match.id)

      const matchItem = {
        id: match.id,
        oldPath: match.path,
        newPath: filePath,
        confidence,
        contentHash,
      }

      matches.push(matchItem)

      yield {
        type: 'match',
        match: matchItem,
        scanned,
        matched: matches.length,
      }
    }

    if (scanned % 20 === 0 || match) {
      yield {
        type: 'progress',
        phase: 'scanning',
        scanned,
        sizeMatched,
        missing: missingMedia.length,
        matched: matches.length,
        current: filePath,
      }
    }
  }

  yield {
    type: 'complete',
    scanned,
    sizeMatched,
    matched: matches.length,
    matches,
    missing: missingMedia.length,
    stopped: shouldStop(),
  }
}

module.exports = {
  getMissingMediaStatus,
  loadMissingMedia,
  iterateMissingMediaSearch,
}
