const path = require('path')
const {
  extractVideoFrame,
  extractVideoThumbnail,
} = require('../../utils/ffmpeg')

function lazyService(modulePath) {
  let cached
  return () => {
    if (!cached) cached = require(modulePath)
    return cached
  }
}

const getVideoClipTagger = lazyService('../../services/videoClipTagger')
const getEmbeddingModel = lazyService('../../services/embeddingModel')
const getImageMedia = lazyService('../../services/imageMedia')
const getVideoImagesGeneration = lazyService('../../services/videoImagesGeneration')

const GENERATED_MEDIA_FOLDERS = {
  timelines: 'media/videos/timelines',
  grids: 'media/videos/grids',
  marks: 'media/videos/marks',
  'image-thumbs': 'media/images/thumbs',
}

const resolveGeneratedFolderPath = (dbPath, folderKey) => {
  const relativePath = GENERATED_MEDIA_FOLDERS[folderKey]
  if (!relativePath) return null
  return path.join(dbPath, relativePath)
}

module.exports = function createTaskControllerShared(db) {
  const dbPath = db.path
  const Op = db.Sequelize.Op
  const Sequelize = db.Sequelize

  const withTimeout = (promise, ms, label) => Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    }),
  ])

  const createStreamAbortSignal = (req, res) => {
    let stopped = false
    const stop = () => {
      stopped = true
    }

    // Do not use req 'close': on Windows it fires once the POST body is read,
    // which cancels long-running stream tasks before any work starts.
    req.on('aborted', stop)
    res.on('close', () => {
      if (!res.writableFinished) {
        stop()
      }
    })

    return () => stopped
  }

  const parserSettingDefaults = {
    'pathParser.useML': true,
    'pathParser.similarityThreshold': 0.75,
    'pathParser.folderWeight': 1.5,
    'pathParser.clusterThreshold': 0.88,
  }

  const parseBooleanSetting = value => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    return String(value).toLowerCase() === 'true'
  }

  const getParserSettings = async (overrides: Record<string, any> = {}) => {
    const options = Object.keys(parserSettingDefaults)
    const rows = await db.Setting.findAll({
      where: {option: options},
      raw: true,
    })

    const settings = {...parserSettingDefaults}
    for (const row of rows) {
      if (row.option === 'pathParser.useML') settings[row.option] = parseBooleanSetting(row.value)
      else settings[row.option] = Number(row.value)
    }

    return {
      useML: parseBooleanSetting(overrides.useML ?? settings['pathParser.useML']),
      similarityThreshold: Number(overrides.similarityThreshold ?? settings['pathParser.similarityThreshold']),
      folderWeight: Number(overrides.folderWeight ?? settings['pathParser.folderWeight']),
      clusterThreshold: Number(overrides.clusterThreshold ?? settings['pathParser.clusterThreshold']),
    }
  }

  const createThumbMiddle = (pathToFile, id) => {
    const outputPath = path.join(dbPath, 'media/videos/thumbs', `${id}.jpg`)
    return withTimeout(
      extractVideoThumbnail({input: pathToFile, outputPath, height: 320}),
      120000,
      'ffmpeg thumbnail',
    ).then(() => 'success')
  }

  const createThumbCustom = (timestamp, inputPath, outputPath, width) => {
    return extractVideoFrame({
      input: inputPath,
      output: outputPath,
      timestamp,
      vf: `scale=-1:${width}`,
    })
  }

  return {
    db,
    dbPath,
    Op,
    Sequelize,
    withTimeout,
    createStreamAbortSignal,
    getParserSettings,
    getVideoClipTagger,
    getEmbeddingModel,
    getImageMedia,
    getVideoImagesGeneration,
    resolveGeneratedFolderPath: (folderKey) => resolveGeneratedFolderPath(dbPath, folderKey),
    createThumbMiddle,
    createThumbCustom,
  }
}
