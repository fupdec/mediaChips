import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

const fs = require('fs')
const path = require('path')
const {Jimp} = require('jimp')

const THUMB_HEIGHT = 320
const THUMB_JPEG_QUALITY = 85

async function writeJpeg(image: any, outputPath: any, quality: any= THUMB_JPEG_QUALITY) {
  const buffer = await image.getBuffer('image/jpeg', {quality})
  await fs.promises.writeFile(outputPath, buffer)
}

const getImageMetadata = async (pathToFile: any) => {
  try {
    const image = await Jimp.read(pathToFile)
    return {
      width: image.width,
      height: image.height,
      orientation: 1,
    }
  } catch (error: any) {
    console.error(`Image metadata extraction failed for ${pathToFile}:`, error.message)
    return null
  }
}

const ensureImageThumbDir = (dbPath: any) => {
  const outputDir = path.join(dbPath, 'media/images/thumbs')
  fs.mkdirSync(outputDir, {recursive: true})
  return outputDir
}

const createImageThumb = async (pathToFile: any, id: any, dbPath: any) => {
  const outputDir = ensureImageThumbDir(dbPath)
  const outputPath = path.join(outputDir, `${id}.jpg`)
  const image = await Jimp.read(pathToFile)

  if (image.height > THUMB_HEIGHT) {
    await image.resize({h: THUMB_HEIGHT})
  }

  await writeJpeg(image, outputPath)
  return outputPath
}

async function processAndSaveImage({buffer, outputPath, sizes}: any) {
  let image = await Jimp.read(buffer)
  const width = image.width
  const height = image.height
  const aspectRatio = width / height

  if (sizes?.width && sizes?.height) {
    const minWidth = sizes.width
    const minHeight = sizes.height
    const minAspectRatio = minWidth / minHeight

    if (Math.abs(minAspectRatio - aspectRatio) > 0.01) {
      let cropWidth
      let cropHeight
      let x
      let y

      if (minAspectRatio < 1) {
        cropHeight = height
        cropWidth = height * minAspectRatio
        x = Math.max((width - cropWidth) / 2, 0)
        y = 0
      } else {
        cropWidth = width
        cropHeight = width / minAspectRatio
        x = 0
        y = Math.max((height - cropHeight) / 2, 0)
      }

      await image.crop({
        x: Math.floor(x),
        y: Math.floor(y),
        w: Math.floor(cropWidth),
        h: Math.floor(cropHeight),
      })
    }

    if (minWidth < image.width || minHeight < image.height) {
      await image.resize({w: minWidth, h: minHeight})
    }
  }

  await writeJpeg(image, outputPath, THUMB_JPEG_QUALITY)
  return outputPath
}

module.exports = {
  getImageMetadata,
  createImageThumb,
  ensureImageThumbDir,
  processAndSaveImage,
}
