const fs = require('fs')
const {readdir} = require('fs/promises')
const os = require('os')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const {configureFfmpeg} = require('../utils/ffmpegPaths')
const {resolveExistingPath} = require('./contentHash')

configureFfmpeg()

async function getVideoMediaTypeId(db) {
  const videoType = await db.MediaType.findOne({
    where: {type: 'video'},
    raw: true,
  })
  return videoType?.id || null
}

const IMAGE_TYPES = ['preview', 'grid', 'timeline', 'marks']

const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  }),
])

const formatMarkTimestamp = (time) => new Date(1000 * time).toISOString().substr(11, 12)

const getPreviewPath = (dbPath, id) => path.join(dbPath, 'media/videos/thumbs', `${id}.jpg`)
const getGridPath = (dbPath, id) => path.join(dbPath, 'media/videos/grids', `${id}.jpg`)
const getTimelineMarkerPath = (dbPath, id) => path.join(dbPath, 'media/videos/timelines', `${id}_95.jpg`)
const getMarkPath = (dbPath, id) => path.join(dbPath, 'media/videos/marks', `${id}.jpg`)

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {recursive: true})
  }
}

function hasGeneratedImage(dbPath, imageType, item) {
  switch (imageType) {
    case 'preview':
      return fs.existsSync(getPreviewPath(dbPath, item.id))
    case 'grid':
      return fs.existsSync(getGridPath(dbPath, item.id))
    case 'timeline':
      return fs.existsSync(getTimelineMarkerPath(dbPath, item.id))
    case 'marks':
      return fs.existsSync(getMarkPath(dbPath, item.id))
    default:
      return false
  }
}

function createPreviewImage(pathToFile, id, dbPath) {
  const thumbsDir = path.join(dbPath, 'media/videos/thumbs')
  ensureDir(thumbsDir)
  const outputPath = getPreviewPath(dbPath, id)
  return withTimeout(new Promise((resolve, reject) => {
    ffmpeg()
      .input(pathToFile)
      .screenshots({
        count: 1,
        filename: `${id}.jpg`,
        folder: path.join(dbPath, 'media/videos/thumbs'),
        size: '?x320',
      })
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
  }), 120000, 'ffmpeg thumbnail')
}

function createMarkImage(timestamp, inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .addOption('-ss', timestamp)
      .addOption('-i', inputPath)
      .addOption('-frames:v', '1')
      .addOption('-vf', 'scale=-1:180')
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
  })
}

class VideoGrid {
  constructor(opts, dbPath) {
    this.dbPath = dbPath
    this.tmpDir = os.tmpdir()
    this.input = opts.input
    this.output = opts.output
    this.cols = opts.cols
    this.rows = opts.rows
    this.width = opts.width
    this.tileCount = this.rows * this.cols
    this.gridsPath = path.join(dbPath, 'media/videos/grids')
    ensureDir(this.gridsPath)
  }

  getVideoDuration(pathToFile) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(pathToFile, (error, info) => {
        if (error) return reject(error)
        return resolve(info.format.duration)
      })
    })
  }

  makeLayout(i) {
    const currentColumn = i % this.cols
    const currentRow = Math.floor(i / this.cols)
    const colSide = []
    const rowSide = []
    if (currentColumn === 0) colSide.push('0')
    else for (let j = 0; j < currentColumn; j++) colSide.push('w0')
    if (currentRow === 0) rowSide.push('0')
    else for (let k = 0; k < currentRow; k++) rowSide.push('h0')
    return `${colSide.join('+')}_${rowSide.join('+')}`
  }

  ffmpegSeekP(timestamp, intermediateOutput) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .addOption('-ss', timestamp)
        .addOption('-i', this.input)
        .addOption('-frames:v', '1')
        .save(intermediateOutput)
        .on('end', () => {
          setTimeout(() => resolve(intermediateOutput), 500)
        })
        .on('error', (err) => reject(err))
    })
  }

  ffmpegCombineP(inputFiles, streams, layouts) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg()
      inputFiles.forEach((inputFile) => command.input(inputFile))
      command
        .addOption('-y')
        .addOption(
          '-filter_complex',
          `${streams.join('')}xstack=inputs=${this.tileCount}:layout=${layouts.join('|')}[v];[v]scale=${Math.floor(this.width * this.cols)}:-1[scaled]`,
        )
        .addOption('-map', '[scaled]')
        .save(path.join(this.gridsPath, this.output))
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
    })
  }

  async generate() {
    const duration = await this.getVideoDuration(this.input)
    if (typeof duration !== 'number') return false
    const durSlice = parseInt(duration / this.tileCount, 10)

    const framePromises = []
    for (let i = 0; i < this.tileCount; i++) {
      const timestamp = new Date(1000 * (i + 0.5) * durSlice).toISOString().substr(11, 8)
      const intermediateOutput = path.join(this.tmpDir, `thumb${i}.png`)
      framePromises.push(this.ffmpegSeekP(timestamp, intermediateOutput))
    }

    await Promise.all(framePromises).catch(() => {})

    const inputFiles = []
    const streams = []
    const layouts = []
    for (let l = 0; l < this.tileCount; l++) {
      inputFiles.push(path.join(this.tmpDir, `thumb${l}.png`))
      streams.push(`[${l}:v]`)
      layouts.push(this.makeLayout(l))
    }

    await this.ffmpegCombineP(inputFiles, streams, layouts)
    return {output: this.output}
  }
}

class VideoTimeline {
  constructor(video, dbPath) {
    this.video = video
    this.timelinesPath = path.join(dbPath, 'media/videos/timelines')
    ensureDir(this.timelinesPath)
  }

  getVideoDuration(pathToFile) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(pathToFile, (error, info) => {
        if (error) return reject(error)
        return resolve(info.format.duration)
      })
    })
  }

  createFrame(timestamp, output) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .addOption('-ss', timestamp)
        .addOption('-i', this.video.path)
        .addOption('-frames:v', '1')
        .addOption('-vf', 'scale=-1:180')
        .save(output)
        .on('end', () => {
          setTimeout(() => resolve(output), 500)
        })
        .on('error', (err) => reject(err))
    })
  }

  async generate() {
    const parts = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
    const duration = await this.getVideoDuration(this.video.path)
    if (typeof duration !== 'number') return false
    const timestamps = parts.map((i) => (
      new Date(Math.floor(duration * (i / 100) * 1000)).toISOString().substr(11, 8)
    ))

    const framePromises = []
    for (let i = 0; i < timestamps.length; i++) {
      const output = path.join(this.timelinesPath, `${this.video.id}_${parts[i]}.jpg`)
      framePromises.push(this.createFrame(timestamps[i], output))
    }

    return Promise.all(framePromises)
  }
}

async function generateVideoImage(dbPath, imageType, item, {force = false} = {}) {
  if (!force && hasGeneratedImage(dbPath, imageType, item)) {
    return {status: 'skipped', id: item.id, path: item.path || item.media?.path}
  }

  const videoPath = imageType === 'marks'
    ? (item.media?.path || item.Media?.path)
    : item.path

  if (!videoPath) {
    return {status: 'missing', id: item.id, path: videoPath}
  }

  const resolvedPath = await resolveExistingPath(videoPath)
  if (!resolvedPath) {
    return {status: 'missing', id: item.id, path: videoPath}
  }

  try {
    switch (imageType) {
      case 'preview':
        await createPreviewImage(resolvedPath, item.id, dbPath)
        break
      case 'grid': {
        const gridPath = getGridPath(dbPath, item.id)
        if (force && fs.existsSync(gridPath)) fs.unlinkSync(gridPath)
        const grid = new VideoGrid({
          input: resolvedPath,
          output: `${item.id}.jpg`,
          width: 180,
          cols: 3,
          rows: 3,
        }, dbPath)
        await grid.generate()
        break
      }
      case 'timeline': {
        const timelineMarker = getTimelineMarkerPath(dbPath, item.id)
        if (force && fs.existsSync(timelineMarker)) {
          const parts = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
          for (const part of parts) {
            const framePath = path.join(dbPath, 'media/videos/timelines', `${item.id}_${part}.jpg`)
            if (fs.existsSync(framePath)) fs.unlinkSync(framePath)
          }
        }
        const timeline = new VideoTimeline({id: item.id, path: resolvedPath}, dbPath)
        await timeline.generate()
        break
      }
      case 'marks': {
        const marksDir = path.join(dbPath, 'media/videos/marks')
        ensureDir(marksDir)
        const outputPath = getMarkPath(dbPath, item.id)
        if (force && fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        await createMarkImage(formatMarkTimestamp(item.time), resolvedPath, outputPath)
        break
      }
      default:
        throw new Error(`Unknown image type: ${imageType}`)
    }

    return {status: 'created', id: item.id, path: videoPath}
  } catch (error) {
    return {
      status: 'failed',
      id: item.id,
      path: videoPath,
      message: error.message,
    }
  }
}

const GENERATED_DIR_BY_TYPE = {
  preview: 'media/videos/thumbs',
  grid: 'media/videos/grids',
  timeline: 'media/videos/timelines',
  marks: 'media/videos/marks',
}

function buildStatus(total, generated) {
  return {
    total,
    generated,
    pending: Math.max(total - generated, 0),
  }
}

function countGenerated(items, existingIds) {
  let generated = 0

  for (const item of items) {
    if (existingIds.has(String(item.id))) generated += 1
  }

  return generated
}

async function loadGeneratedIdSet(dbPath, imageType) {
  const relativeDir = GENERATED_DIR_BY_TYPE[imageType]
  if (!relativeDir) return new Set()

  const dirPath = path.join(dbPath, relativeDir)
  if (!fs.existsSync(dirPath)) return new Set()

  const files = await readdir(dirPath)
  const ids = new Set()

  for (const file of files) {
    if (imageType === 'timeline') {
      if (file.endsWith('_95.jpg')) {
        ids.add(file.slice(0, -'_95.jpg'.length))
      }
      continue
    }

    if (file.endsWith('.jpg')) {
      ids.add(file.slice(0, -4))
    }
  }

  return ids
}

async function getVideoImagesGenerationStatus(db, dbPath) {
  const videoTypeId = await getVideoMediaTypeId(db)
  const [
    previewIds,
    gridIds,
    timelineIds,
    markImageIds,
    videoRows,
    markRows,
  ] = await Promise.all([
    loadGeneratedIdSet(dbPath, 'preview'),
    loadGeneratedIdSet(dbPath, 'grid'),
    loadGeneratedIdSet(dbPath, 'timeline'),
    loadGeneratedIdSet(dbPath, 'marks'),
    videoTypeId
      ? db.Media.findAll({
        where: {mediaTypeId: videoTypeId},
        attributes: ['id'],
        raw: true,
      })
      : Promise.resolve([]),
    db.Mark.findAll({
      attributes: ['id'],
      raw: true,
    }),
  ])

  const videoTotal = videoRows.length
  const marksTotal = markRows.length

  return {
    preview: buildStatus(videoTotal, countGenerated(videoRows, previewIds)),
    grid: buildStatus(videoTotal, countGenerated(videoRows, gridIds)),
    timeline: buildStatus(videoTotal, countGenerated(videoRows, timelineIds)),
    marks: buildStatus(marksTotal, countGenerated(markRows, markImageIds)),
  }
}

async function* iterateVideoImagesGeneration(db, dbPath, imageType, {
  shouldStop = () => false,
  force = false,
} = {}) {
  const Op = db.Sequelize.Op

  if (!IMAGE_TYPES.includes(imageType)) {
    yield {type: 'error', message: `Unknown image type: ${imageType}`}
    return
  }

  let total = 0
  if (imageType === 'marks') {
    total = await db.Mark.count()
  } else {
    const videoTypeId = await getVideoMediaTypeId(db)
    if (!videoTypeId) {
      yield {type: 'complete', processed: 0, total: 0, created: 0, skipped: 0, missing: 0, failed: 0}
      return
    }
    total = await db.Media.count({where: {mediaTypeId: videoTypeId}})
  }

  let processed = 0
  let created = 0
  let skipped = 0
  let missing = 0
  let failed = 0
  let lastId = 0

  yield {
    type: 'progress',
    processed,
    total,
    remaining: total,
    created,
    skipped,
    missing,
    failed,
  }

  while (!shouldStop()) {
    let item

    if (imageType === 'marks') {
      item = await db.Mark.findOne({
        where: {id: {[Op.gt]: lastId}},
        include: [db.Media],
        order: [['id', 'ASC']],
      })
      if (!item) break
      item = item.toJSON()
      item.media = item.media || item.Media
    } else {
      const videoTypeId = await getVideoMediaTypeId(db)
      item = await db.Media.findOne({
        where: {
          mediaTypeId: videoTypeId,
          id: {[Op.gt]: lastId},
        },
        order: [['id', 'ASC']],
        raw: true,
      })
      if (!item) break
    }

    lastId = item.id

    if (!force && hasGeneratedImage(dbPath, imageType, item)) {
      processed += 1
      skipped += 1
      yield {
        type: 'progress',
        processed,
        total,
        remaining: Math.max(total - processed, 0),
        created,
        skipped,
        missing,
        failed,
        current: item.path || item.media?.path,
        lastStatus: 'skipped',
      }
      continue
    }

    const result = await generateVideoImage(dbPath, imageType, item, {force})
    processed += 1

    if (result.status === 'created') created += 1
    else if (result.status === 'skipped') skipped += 1
    else if (result.status === 'missing') missing += 1
    else failed += 1

    yield {
      type: 'progress',
      processed,
      total,
      remaining: Math.max(total - processed, 0),
      created,
      skipped,
      missing,
      failed,
      current: result.path,
      lastStatus: result.status,
    }
  }

  yield {
    type: 'complete',
    processed,
    total,
    created,
    skipped,
    missing,
    failed,
    stopped: shouldStop(),
  }
}

module.exports = {
  IMAGE_TYPES,
  getVideoImagesGenerationStatus,
  iterateVideoImagesGeneration,
}
