const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const THUMB_HEIGHT = 320
const THUMB_JPEG_QUALITY = 85

const getImageMetadata = async (pathToFile) => {
  try {
    const metadata = await sharp(pathToFile).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    if (!width || !height) {
      return null
    }

    return {
      width,
      height,
      orientation: metadata.orientation || 1,
    }
  } catch (error) {
    console.error(`Image metadata extraction failed for ${pathToFile}:`, error.message)
    return null
  }
}

const ensureImageThumbDir = (dbPath) => {
  const outputDir = path.join(dbPath, 'media/images/thumbs')
  fs.mkdirSync(outputDir, {recursive: true})
  return outputDir
}

const createImageThumb = async (pathToFile, id, dbPath) => {
  const outputDir = ensureImageThumbDir(dbPath)
  const outputPath = path.join(outputDir, `${id}.jpg`)

  await sharp(pathToFile)
    .rotate()
    .resize({
      height: THUMB_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({quality: THUMB_JPEG_QUALITY})
    .toFile(outputPath)

  return outputPath
}

module.exports = {
  getImageMetadata,
  createImageThumb,
  ensureImageThumbDir,
}
