const fs = require('fs').promises
const fssync = require('fs')
const path = require('path')
const { pipeline } = require('stream/promises')

const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  EXISTS: 'EXISTS',
  NO_SPACE: 'NO_SPACE',
  ACCESS_DENIED: 'ACCESS_DENIED',
  DB_NOT_FOUND: 'DB_NOT_FOUND',
  UNKNOWN: 'UNKNOWN',
}

async function getFreeDiskSpace(targetPath) {
  try {
    const dir = (await fs.stat(targetPath).catch(() => null))?.isDirectory()
      ? targetPath
      : path.dirname(targetPath)
    const stats = await fs.statfs(dir)
    return stats.bavail * stats.bsize
  } catch {
    return null
  }
}

async function isCrossDevice(sourcePath, destinationPath) {
  try {
    const sourceStat = await fs.stat(sourcePath)
    const destDir = path.dirname(destinationPath)
    await fs.mkdir(destDir, { recursive: true })
    const destStat = await fs.stat(destDir)
    return sourceStat.dev !== destStat.dev
  } catch {
    return true
  }
}

async function copyFileWithProgress(sourcePath, destinationPath, onProgress) {
  const { size } = await fs.stat(sourcePath)
  let transferred = 0

  const readStream = fssync.createReadStream(sourcePath)
  const writeStream = fssync.createWriteStream(destinationPath)

  readStream.on('data', (chunk) => {
    transferred += chunk.length
    if (onProgress) onProgress(transferred, size)
  })

  await pipeline(readStream, writeStream)
  if (onProgress) onProgress(size, size)
}

async function moveFile(sourcePath, destinationPath, onProgress) {
  if (!(await fs.stat(sourcePath).catch(() => null))) {
    const err = new Error('Source file not found')
    err.code = ERROR_CODES.NOT_FOUND
    throw err
  }

  if (await fs.stat(destinationPath).catch(() => null)) {
    const err = new Error('Destination file already exists')
    err.code = ERROR_CODES.EXISTS
    throw err
  }

  const destDir = path.dirname(destinationPath)
  await fs.mkdir(destDir, { recursive: true })

  const crossDevice = await isCrossDevice(sourcePath, destinationPath)

  if (crossDevice) {
    const fileSize = (await fs.stat(sourcePath)).size
    const freeSpace = await getFreeDiskSpace(destinationPath)
    if (freeSpace !== null && freeSpace < fileSize) {
      const err = new Error('Not enough disk space')
      err.code = ERROR_CODES.NO_SPACE
      err.required = fileSize
      err.available = freeSpace
      throw err
    }

    await copyFileWithProgress(sourcePath, destinationPath, onProgress)
    await fs.unlink(sourcePath)
    return { crossDevice: true, size: fileSize }
  }

  try {
    await fs.rename(sourcePath, destinationPath)
    if (onProgress) {
      const size = (await fs.stat(destinationPath)).size
      onProgress(size, size)
    }
    return { crossDevice: false, size: (await fs.stat(destinationPath)).size }
  } catch (error) {
    if (error.code === 'EXDEV') {
      const fileSize = (await fs.stat(sourcePath)).size
      const freeSpace = await getFreeDiskSpace(destinationPath)
      if (freeSpace !== null && freeSpace < fileSize) {
        const err = new Error('Not enough disk space')
        err.code = ERROR_CODES.NO_SPACE
        err.required = fileSize
        err.available = freeSpace
        throw err
      }

      await copyFileWithProgress(sourcePath, destinationPath, onProgress)
      await fs.unlink(sourcePath)
      return { crossDevice: true, size: fileSize }
    }

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      const err = new Error('Access denied')
      err.code = ERROR_CODES.ACCESS_DENIED
      throw err
    }

    const err = new Error(error.message || 'Move failed')
    err.code = ERROR_CODES.UNKNOWN
    throw err
  }
}

async function prepareMoveItems(db, items) {
  const prepared = []
  let totalBytes = 0
  let bytesNeedingCopy = 0

  for (const item of items) {
    const media = await db.Media.findOne({ where: { id: item.id } })
    if (!media) {
      prepared.push({
        id: item.id,
        error: { code: ERROR_CODES.DB_NOT_FOUND, message: 'Media not found in database' },
      })
      continue
    }

    const oldPath = media.dataValues.path
    const fileName = path.basename(oldPath)
    const newPath = path.join(item.folder, fileName)

    const sourceExists = await fs.stat(oldPath).catch(() => null)
    if (!sourceExists) {
      prepared.push({
        id: item.id,
        fileName,
        folder: item.folder,
        oldPath,
        newPath,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Source file not found' },
      })
      continue
    }

    const destExists = await fs.stat(newPath).catch(() => null)
    if (destExists) {
      prepared.push({
        id: item.id,
        fileName,
        folder: item.folder,
        oldPath,
        newPath,
        error: { code: ERROR_CODES.EXISTS, message: 'Destination file already exists' },
      })
      continue
    }

    if (path.resolve(oldPath) === path.resolve(newPath)) {
      prepared.push({
        id: item.id,
        fileName,
        folder: item.folder,
        oldPath,
        newPath,
        skip: true,
        size: sourceExists.size,
      })
      continue
    }

    const size = sourceExists.size
    totalBytes += size

    const crossDevice = await isCrossDevice(oldPath, newPath)
    if (crossDevice) bytesNeedingCopy += size

    prepared.push({
      id: item.id,
      fileName,
      folder: item.folder,
      oldPath,
      newPath,
      size,
      crossDevice,
    })
  }

  return { prepared, totalBytes, bytesNeedingCopy }
}

async function checkBatchDiskSpace(prepared, bytesNeedingCopy) {
  if (bytesNeedingCopy <= 0) return null

  const spaceByRoot = new Map()

  for (const item of prepared) {
    if (!item.crossDevice || item.error) continue
    const root = path.parse(item.newPath).root
    spaceByRoot.set(root, (spaceByRoot.get(root) || 0) + item.size)
  }

  for (const [root, required] of spaceByRoot) {
    const samplePath = prepared.find(i => i.newPath && path.parse(i.newPath).root === root)?.newPath
    if (!samplePath) continue

    const freeSpace = await getFreeDiskSpace(samplePath)
    if (freeSpace !== null && freeSpace < required) {
      return { required, available: freeSpace, root }
    }
  }

  return null
}

function estimateSeconds(totalBytes, bytesNeedingCopy) {
  const renameBytes = totalBytes - bytesNeedingCopy
  const copySpeed = 80 * 1024 * 1024 // ~80 MB/s conservative estimate
  const copySeconds = bytesNeedingCopy / copySpeed
  const renameSeconds = renameBytes > 0 ? Math.min(2, Math.ceil(renameBytes / (5 * 1024 * 1024 * 1024))) : 0
  return Math.max(1, Math.ceil(copySeconds + renameSeconds))
}

async function prepareRename(oldPath, newPath) {
  const fileName = path.basename(newPath)
  const folder = path.dirname(newPath)

  const sourceExists = await fs.stat(oldPath).catch(() => null)
  if (!sourceExists) {
    return {
      oldPath,
      newPath,
      fileName,
      folder,
      error: { code: ERROR_CODES.NOT_FOUND, message: 'Source file not found' },
    }
  }

  const destExists = await fs.stat(newPath).catch(() => null)
  if (destExists) {
    return {
      oldPath,
      newPath,
      fileName,
      folder,
      error: { code: ERROR_CODES.EXISTS, message: 'Destination file already exists' },
    }
  }

  if (path.resolve(oldPath) === path.resolve(newPath)) {
    return {
      oldPath,
      newPath,
      fileName,
      folder,
      skip: true,
      size: sourceExists.size,
    }
  }

  const size = sourceExists.size
  const crossDevice = await isCrossDevice(oldPath, newPath)

  return {
    oldPath,
    newPath,
    fileName,
    folder,
    size,
    crossDevice,
  }
}

async function checkRenameDiskSpace(prepared) {
  if (!prepared.crossDevice) return null

  const freeSpace = await getFreeDiskSpace(prepared.newPath)
  if (freeSpace !== null && freeSpace < prepared.size) {
    return { required: prepared.size, available: freeSpace }
  }

  return null
}

module.exports = {
  ERROR_CODES,
  moveFile,
  prepareMoveItems,
  prepareRename,
  checkBatchDiskSpace,
  checkRenameDiskSpace,
  estimateSeconds,
  isCrossDevice,
  getFreeDiskSpace,
}
