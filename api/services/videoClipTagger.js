const fs = require('fs')
const os = require('os')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const {configureFfmpeg} = require('../utils/ffmpegPaths')
const {
  getLocalizedLabel,
  getPromptEntries,
  tags,
} = require('./videoClipTagDictionary')

const CLIP_MODEL = 'Xenova/clip-vit-base-patch32'

configureFfmpeg()

let classifier = null
let loadingPromise = null
let lastError = null

function getWritableModelCacheDir(db) {
  const base = db?.path_databases || process.app_folder || path.join(__dirname, '../../app_storage')
  return path.join(base, 'models')
}

function getBundledModelsDir() {
  if (process.resourcesPath) {
    const bundled = path.join(process.resourcesPath, 'models')
    if (fs.existsSync(bundled)) return bundled
  }

  const projectModels = path.join(__dirname, '..', '..', 'models')
  if (fs.existsSync(projectModels)) return projectModels

  return null
}

function getModelCacheDir(db) {
  return getWritableModelCacheDir(db)
}

function hasDownloadedModel(db) {
  const cacheDir = getModelCacheDir(db)
  if (!fs.existsSync(cacheDir)) return false

  const stack = [cacheDir]
  while (stack.length) {
    const dir = stack.pop()
    const entries = fs.readdirSync(dir, {withFileTypes: true})
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) stack.push(entryPath)
      else if (/\.(onnx|json|txt)$/i.test(entry.name) && entryPath.includes('clip-vit-base-patch32')) {
        return true
      }
    }
  }

  return false
}

async function loadModel(db) {
  if (classifier) return classifier
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    const cacheDir = getWritableModelCacheDir(db)
    const bundledDir = getBundledModelsDir()
    fs.mkdirSync(cacheDir, {recursive: true})

    try {
      const {pipeline, env} = require('@xenova/transformers')

      env.cacheDir = cacheDir
      env.localModelPath = bundledDir || cacheDir
      env.allowRemoteModels = true
      env.allowLocalModels = true

      classifier = await pipeline('zero-shot-image-classification', CLIP_MODEL, {
        quantized: true,
      })
      lastError = null
      return classifier
    } catch (error) {
      lastError = error
      throw error
    } finally {
      loadingPromise = null
    }
  })()

  return loadingPromise
}

function getStatus(db, enabled = true) {
  if (!enabled) return {status: 'disabled', model: CLIP_MODEL}
  if (classifier) return {status: 'loaded', model: CLIP_MODEL, path: getModelCacheDir(db)}
  if (loadingPromise) return {status: 'loading', model: CLIP_MODEL, path: getModelCacheDir(db)}
  if (lastError) {
    return {
      status: 'error',
      model: CLIP_MODEL,
      path: getModelCacheDir(db),
      message: lastError.message,
    }
  }

  return {
    status: hasDownloadedModel(db) ? 'downloaded' : 'not_downloaded',
    model: CLIP_MODEL,
    path: getModelCacheDir(db),
  }
}

function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, info) => {
      if (error) return reject(error)

      const duration = Number(info?.format?.duration || 0)
      if (!duration) return reject(new Error('Video duration is unavailable.'))

      return resolve(duration)
    })
  })
}

function createFrame(input, output, timestamp, width = 384) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .addOption('-ss', timestamp)
      .addOption('-i', input)
      .addOption('-frames:v', '1')
      .addOption('-vf', `scale=${width}:-1`)
      .save(output)
      .on('end', () => resolve(output))
      .on('error', reject)
  })
}

function formatTimestamp(seconds) {
  return new Date(Math.floor(seconds) * 1000).toISOString().substr(11, 8)
}

function getFrameTimestamps(duration, count) {
  const safeCount = Math.max(1, Math.min(Number(count || 4), 10))
  const ratios = safeCount === 1
    ? [0.5]
    : Array.from({length: safeCount}, (_, index) => 0.15 + (0.75 * (index / (safeCount - 1))))

  return ratios.map(ratio => formatTimestamp(duration * ratio))
}

async function extractFrames(media, options = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mediachips-clip-tags-'))
  const frames = []
  const frameWidth = Number(options.frameWidth || 384)
  const framesPerVideo = Number(options.framesPerVideo || 4)

  for (const item of media) {
    if (!item?.path || !fs.existsSync(item.path)) continue

    let duration
    try {
      duration = await getVideoDuration(item.path)
    } catch (error) {
      continue
    }

    const timestamps = getFrameTimestamps(duration, framesPerVideo)
    for (let index = 0; index < timestamps.length; index++) {
      const output = path.join(tmpDir, `${item.id || frames.length}_${index}.jpg`)
      try {
        await createFrame(item.path, output, timestamps[index], frameWidth)
        frames.push({
          framePath: output,
          mediaId: item.id,
          mediaPath: item.path,
          timestamp: timestamps[index],
        })
      } catch (error) {
        // Broken frames should not block suggestions for the rest of the import.
      }
    }
  }

  return {tmpDir, frames}
}

async function extractFramesForMedia(item, options = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mediachips-clip-tags-'))
  const frames = []
  const frameWidth = Number(options.frameWidth || 384)
  const framesPerVideo = Number(options.framesPerVideo || 4)

  if (!item?.path || !fs.existsSync(item.path)) return {tmpDir, frames}

  let duration
  try {
    duration = await getVideoDuration(item.path)
  } catch (error) {
    return {tmpDir, frames}
  }

  const timestamps = getFrameTimestamps(duration, framesPerVideo)
  for (let index = 0; index < timestamps.length; index++) {
    const output = path.join(tmpDir, `${item.id || 'media'}_${index}.jpg`)
    try {
      await createFrame(item.path, output, timestamps[index], frameWidth)
      frames.push({
        framePath: output,
        mediaId: item.id,
        mediaPath: item.path,
        timestamp: timestamps[index],
      })
    } catch (error) {
      // Broken frames should not block suggestions for the rest of the import.
    }
  }

  return {tmpDir, frames}
}

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

async function classifyFrame(model, frame, promptEntries, options = {}) {
  const topK = Number(options.topK || 8)
  const minScore = Number(options.minScore || 0.03)
  const promptToKey = new Map(promptEntries.map(entry => [entry.prompt, entry.key]))
  const output = await model(frame.framePath, promptEntries.map(entry => entry.prompt))
  const rows = Array.isArray(output) ? output : []
  const bestByKey = new Map()

  for (const row of rows) {
    const key = promptToKey.get(row.label)
    if (!key) continue

    const current = bestByKey.get(key)
    if (!current || row.score > current.score) {
      bestByKey.set(key, {
        key,
        score: row.score,
        prompt: row.label,
        mediaId: frame.mediaId,
        mediaPath: frame.mediaPath,
        timestamp: frame.timestamp,
      })
    }
  }

  return [...bestByKey.values()]
    .sort((a, b) => b.score - a.score)
    .filter(row => row.score >= minScore)
    .slice(0, topK)
}

function aggregateFrameResults(frameResults, locale, existingTags = []) {
  const existing = new Set(existingTags.map(tag => normalizeName(tag.name)))
  const tagByKey = new Map(tags.map(tag => [tag.key, tag]))
  const grouped = new Map()

  for (const row of frameResults.flat()) {
    const tag = tagByKey.get(row.key)
    if (!tag) continue

    const label = getLocalizedLabel(tag, locale)
    if (existing.has(normalizeName(label))) continue

    const current = grouped.get(row.key) || {
      key: row.key,
      word: label,
      label,
      canonical: getLocalizedLabel(tag, 'en'),
      occurrences: 0,
      confidence: 0,
      samples: [],
      mediaIds: [],
    }

    current.occurrences += 1
    current.confidence = Math.max(current.confidence, row.score)
    if (row.mediaId && !current.mediaIds.includes(row.mediaId)) current.mediaIds.push(row.mediaId)
    if (current.samples.length < 3) {
      current.samples.push({
        mediaId: row.mediaId,
        timestamp: row.timestamp,
        score: row.score,
      })
    }

    grouped.set(row.key, current)
  }

  return [...grouped.values()]
    .sort((a, b) => (b.occurrences - a.occurrences) || (b.confidence - a.confidence))
}

function cleanup(tmpDir) {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, {recursive: true, force: true})
  }
}

async function suggestTagsFromVideoFrames(db, media, options = {}) {
  let tmpDir = null

  try {
    const extracted = await extractFrames(media, options)
    tmpDir = extracted.tmpDir

    if (!extracted.frames.length) {
      return {
        suggestions: [],
        frames: 0,
        media: media.length,
        model: CLIP_MODEL,
      }
    }

    const model = await loadModel(db)
    const promptEntries = getPromptEntries()
    const frameResults = []

    for (const frame of extracted.frames) {
      frameResults.push(await classifyFrame(model, frame, promptEntries, options))
    }

    const existingTags = options.excludeExisting === false
      ? []
      : (options.tags || await db.Tag.findAll({raw: true}))

    const suggestions = aggregateFrameResults(frameResults, options.locale || 'en', existingTags)
      .slice(0, Number(options.limit || 50))

    return {
      suggestions,
      frames: extracted.frames.length,
      media: media.length,
      model: CLIP_MODEL,
    }
  } finally {
    cleanup(tmpDir)
  }
}

async function classifyMedia(db, item, options = {}) {
  let tmpDir = null

  try {
    const extracted = await extractFramesForMedia(item, options)
    tmpDir = extracted.tmpDir

    if (!extracted.frames.length) {
      return {
        suggestions: [],
        frames: 0,
        media: item ? 1 : 0,
        model: CLIP_MODEL,
      }
    }

    const model = await loadModel(db)
    const promptEntries = getPromptEntries()
    const frameResults = []

    for (const frame of extracted.frames) {
      frameResults.push(await classifyFrame(model, frame, promptEntries, options))
    }

    const existingTags = options.excludeExisting === false
      ? []
      : (options.tags || await db.Tag.findAll({raw: true}))

    const suggestions = aggregateFrameResults(frameResults, options.locale || 'en', existingTags)
      .slice(0, Number(options.limit || 50))

    return {
      suggestions,
      frames: extracted.frames.length,
      media: item ? 1 : 0,
      model: CLIP_MODEL,
    }
  } finally {
    cleanup(tmpDir)
  }
}

module.exports = {
  CLIP_MODEL,
  aggregateFrameResults,
  classifyMedia,
  getStatus,
  hasDownloadedModel,
  loadModel,
  suggestTagsFromVideoFrames,
}
