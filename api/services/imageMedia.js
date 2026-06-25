const fs = require('fs')
const path = require('path')
const Jimp = require('jimp')

const THUMB_HEIGHT = 320
const THUMB_JPEG_QUALITY = 85

const getImageMetadata = async (pathToFile) => {
  try {
    const image = await Jimp.read(pathToFile)
    return {
      width: image.bitmap.width,
      height: image.bitmap.height,
      orientation: 1,
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

  const image = await Jimp.read(pathToFile)
  if (image.bitmap.height > THUMB_HEIGHT) {
    image.scaleToHeight(THUMB_HEIGHT)
  }
  await image.quality(THUMB_JPEG_QUALITY).writeAsync(outputPath)

  return outputPath
}

module.exports = {
  getImageMetadata,
  createImageThumb,
  ensureImageThumbDir,
}
