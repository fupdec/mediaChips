const {spawn} = require('child_process')
const fs = require('fs')
const path = require('path')
const {ffprobe} = require('../../utils/ffmpeg')
const {getFfmpegPath} = require('../../utils/ffmpegPaths')
const {analyzeProbeResult} = require('./codecCompatibility')
const {
  resolveExistingCache,
  ensureCacheDir,
  writeCacheMeta,
  clearCacheExcept,
  getCacheStats,
  clearCache,
} = require('./transcodeCache')
const {
  getTranscodeSettings,
  isTranscodeEnabled,
  getMaxHeight,
} = require('./transcodeSettings')
const {createLiveStreamRegistry} = require('./liveStreamTranscode')
const {
  getChunkStart,
  getChunkDuration,
} = require('./liveStreamChunk')

const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.opus', '.wma',
])

function isAudioFilePath(filePath) {
  const ext = path.extname(filePath || '').toLowerCase()
  return AUDIO_EXTENSIONS.has(ext)
}

function parseFfmpegTime(value) {
  const match = String(value).match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/)
  if (!match) return null

  return (Number(match[1]) * 3600)
    + (Number(match[2]) * 60)
    + Number(match[3])
}

function buildFfmpegArgs({inputPath, outputPath, audioOnly, maxHeight}) {
  const args = ['-hide_banner', '-loglevel', 'error', '-progress', 'pipe:1', '-nostats', '-y', '-i', inputPath]

  if (audioOnly) {
    args.push('-vn', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputPath)
    return args
  }

  args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23')

  if (maxHeight) {
    args.push('-vf', `scale='min(${maxHeight},iw)':-2`)
  }

  args.push('-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputPath)
  return args
}

function createTranscodeManager({databasesPath, getActiveDbId, db}) {
  const jobs = new Map()
  const playabilityCache = new Map()
  const liveStreams = createLiveStreamRegistry()

  function getPlayabilityCacheKey(filePath, stat) {
    return `${filePath}|${stat.mtimeMs}|${stat.size}`
  }

  async function analyzePlayability(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return {playable: false, reason: 'missing', videoCodec: null, audioCodec: null}
    }

    const stat = fs.statSync(filePath)
    const cacheKey = getPlayabilityCacheKey(filePath, stat)

    if (playabilityCache.has(cacheKey)) {
      return playabilityCache.get(cacheKey)
    }

    const audioOnly = isAudioFilePath(filePath)
    const probe = await ffprobe(filePath)
    const result = analyzeProbeResult(probe, filePath, {audioOnly})
    playabilityCache.set(cacheKey, result)
    return result
  }

  function getJobState(cacheKey) {
    return jobs.get(cacheKey) || null
  }

  function updateJob(cacheKey, patch) {
    const current = jobs.get(cacheKey) || {cacheKey}
    const next = {...current, ...patch}
    jobs.set(cacheKey, next)
    return next
  }

  async function startTranscode(filePath, options = {}) {
    const dbId = getActiveDbId()
    if (!dbId) {
      throw new Error('No active database')
    }

    const settings = options.settings || await getTranscodeSettings(db)
    const cacheInfo = resolveExistingCache(databasesPath, dbId, filePath)
    if (!cacheInfo) {
      throw new Error('Source file not found')
    }

    const {
      cacheKey,
      outputPath,
      metaPath,
      tempPath,
      stat,
    } = {
      ...cacheInfo,
      tempPath: path.join(
        path.dirname(cacheInfo.outputPath),
        `${cacheInfo.cacheKey}.part.mp4`,
      ),
    }

    if (cacheInfo.meta?.status === 'done' && fs.existsSync(outputPath)) {
      return {
        cacheKey,
        status: 'done',
        progress: 100,
        outputPath,
      }
    }

    const existingJob = jobs.get(cacheKey)
    if (existingJob?.status === 'running') {
      return existingJob
    }

    const audioOnly = options.audioOnly ?? isAudioFilePath(filePath)
    const maxHeight = options.maxHeight ?? getMaxHeight(settings)
    const duration = Number((await ffprobe(filePath)).format?.duration || 0)

    ensureCacheDir(path.dirname(outputPath))
    clearCacheExcept(databasesPath, dbId, cacheKey)

    const meta = {
      cacheKey,
      sourcePath: filePath,
      sourceMtime: stat.mtimeMs,
      sourceSize: stat.size,
      outputPath,
      status: 'running',
      progress: 0,
      error: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      audioOnly,
    }

    writeCacheMeta(metaPath, meta)
    updateJob(cacheKey, {...meta, status: 'running', progress: 0, error: null})

    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath)
    }

    await new Promise((resolve, reject) => {
      const args = buildFfmpegArgs({
        inputPath: filePath,
        outputPath: tempPath,
        audioOnly,
        maxHeight,
      })

      const proc = spawn(getFfmpegPath(), args, {stdio: ['ignore', 'pipe', 'pipe']})
      let stderr = ''

      proc.stdout.on('data', (chunk) => {
        const text = chunk.toString()
        const outTimeMatch = text.match(/out_time_us=(\d+)/)
        if (!outTimeMatch || !duration) return

        const seconds = Number(outTimeMatch[1]) / 1_000_000
        const progress = Math.min(99, Math.round((seconds / duration) * 100))
        updateJob(cacheKey, {progress, status: 'running'})
        writeCacheMeta(metaPath, {
          ...meta,
          status: 'running',
          progress,
          updatedAt: Date.now(),
        })
      })

      proc.stderr.on('data', (chunk) => {
        stderr += chunk.toString()
      })

      proc.on('error', reject)
      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
          return
        }

        reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`))
      })
    })

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath)
    }

    fs.renameSync(tempPath, outputPath)

    const doneMeta = {
      ...meta,
      status: 'done',
      progress: 100,
      updatedAt: Date.now(),
    }

    writeCacheMeta(metaPath, doneMeta)
    const doneJob = updateJob(cacheKey, {status: 'done', progress: 100, outputPath, error: null})
    return doneJob
  }

  async function startTranscodeSafe(filePath, options = {}) {
    const dbId = getActiveDbId()
    const cacheInfo = resolveExistingCache(databasesPath, dbId, filePath)
    if (!cacheInfo) {
      throw new Error('Source file not found')
    }

    const {cacheKey, metaPath} = cacheInfo

    try {
      return await startTranscode(filePath, options)
    } catch (error) {
      const failedMeta = {
        ...(readMeta(metaPath) || {}),
        cacheKey,
        sourcePath: filePath,
        status: 'error',
        progress: 0,
        error: error.message,
        updatedAt: Date.now(),
      }

      writeCacheMeta(metaPath, failedMeta)
      updateJob(cacheKey, {status: 'error', progress: 0, error: error.message})
      throw error
    }
  }

  function readMeta(metaPath) {
    try {
      if (!fs.existsSync(metaPath)) return null
      return JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    } catch {
      return null
    }
  }

  async function getPlaybackPlan(filePath, options = {}) {
    const settings = options.settings || await getTranscodeSettings(db)
    const transcodeEnabled = options.transcodeEnabled ?? isTranscodeEnabled(settings)
    const dbId = getActiveDbId()

    if (!filePath || !fs.existsSync(filePath)) {
      return {
        mode: 'missing',
        transcodeRequired: false,
        transcodeStatus: 'none',
        progress: 0,
        error: 'File not found',
        reason: 'missing',
      }
    }

    const playability = await analyzePlayability(filePath)

    if (playability.playable || !transcodeEnabled) {
      return {
        mode: 'direct',
        transcodeRequired: false,
        transcodeStatus: 'none',
        progress: 100,
        error: null,
        reason: playability.reason,
        playability,
      }
    }

    return {
      mode: 'stream',
      transcodeRequired: true,
      transcodeStatus: 'stream',
      streamPlayback: true,
      progress: 0,
      error: null,
      reason: playability.reason,
      playability,
    }
  }

  async function resolveStreamPath(filePath, source = 'auto', options = {}) {
    const settings = options.settings || await getTranscodeSettings(db)
    const transcodeEnabled = options.transcodeEnabled ?? isTranscodeEnabled(settings)
    const plan = await getPlaybackPlan(filePath, {settings, transcodeEnabled})

    if (source === 'direct') {
      return {filePath, contentType: null, plan}
    }

    if (source === 'transcoded') {
      const dbId = getActiveDbId()
      const cacheInfo = resolveExistingCache(databasesPath, dbId, filePath)
      if (cacheInfo?.meta?.status === 'done' && fs.existsSync(cacheInfo.outputPath)) {
        return {filePath: cacheInfo.outputPath, contentType: 'video/mp4', plan}
      }

      return {filePath: null, contentType: null, plan}
    }

    if (plan.mode === 'direct') {
      return {filePath, contentType: null, plan}
    }

    return {filePath: null, contentType: null, plan}
  }

  async function streamLive(req, res, filePath, options = {}) {
    const settings = options.settings || await getTranscodeSettings(db)
    const requestedStart = Math.max(0, Number(options.startTime) || 0)
    const chunkStart = getChunkStart(requestedStart)
    const audioOnly = options.audioOnly ?? isAudioFilePath(filePath)
    const maxHeight = options.maxHeight ?? getMaxHeight(settings)
    const dbId = getActiveDbId()
    const cacheInfo = resolveExistingCache(databasesPath, dbId, filePath)

    if (!cacheInfo) {
      res.status(404).json({message: 'Source file not found'})
      return
    }

    const probe = await ffprobe(filePath)
    const fileDuration = Number(probe.format?.duration || 0)
    const chunkDuration = getChunkDuration({
      chunkStart,
      fileDuration,
    })

    liveStreams.pipeLiveTranscode(req, res, {
      streamKey: cacheInfo.cacheKey,
      inputPath: filePath,
      startTime: chunkStart,
      duration: chunkDuration,
      audioOnly,
      maxHeight,
    })
  }

  function stopLiveStream(filePath) {
    const dbId = getActiveDbId()
    if (!dbId || !filePath) return false

    const cacheInfo = resolveExistingCache(databasesPath, dbId, filePath)
    if (!cacheInfo) return false

    jobs.delete(cacheInfo.cacheKey)
    liveStreams.stopStream(cacheInfo.cacheKey)
    return true
  }

  function stopAllLiveStreams() {
    liveStreams.stopAll()
    return true
  }

  return {
    analyzePlayability,
    getPlaybackPlan,
    resolveStreamPath,
    streamLive,
    stopLiveStream,
    stopAllLiveStreams,
    startTranscode: startTranscodeSafe,
    getTranscodeStatus: async (filePath) => {
      const plan = await getPlaybackPlan(filePath)
      return {
        status: plan.transcodeStatus,
        progress: plan.progress,
        error: plan.error,
        mode: plan.mode,
        reason: plan.reason,
      }
    },
    clearCacheForActiveDb() {
      const dbId = getActiveDbId()
      if (!dbId) return {removed: 0, bytes: 0}
      return clearCache(databasesPath, dbId)
    },
    getCacheStatsForActiveDb() {
      const dbId = getActiveDbId()
      if (!dbId) return {bytes: 0, files: 0, entries: 0}
      return getCacheStats(databasesPath, dbId)
    },
  }
}

module.exports = {
  createTranscodeManager,
  buildFfmpegArgs,
  parseFfmpegTime,
  isAudioFilePath,
}
