const fs = require('fs')
const path = require('path')
const {ffprobe} = require('../../utils/ffmpeg')
const {analyzeProbeResult} = require('./codecCompatibility')
const {
  resolveExistingCache,
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

function createTranscodeManager({databasesPath, getActiveDbId, db}) {
  const playabilityCache = new Map()
  const PLAYABILITY_CACHE_MAX = 500
  const liveStreams = createLiveStreamRegistry()

  function getPlayabilityCacheKey(filePath, stat) {
    return `${filePath}|${stat.mtimeMs}|${stat.size}`
  }

  function setPlayabilityCacheEntry(cacheKey, result) {
    if (playabilityCache.has(cacheKey)) {
      playabilityCache.delete(cacheKey)
    }
    playabilityCache.set(cacheKey, result)

    while (playabilityCache.size > PLAYABILITY_CACHE_MAX) {
      const oldestKey = playabilityCache.keys().next().value
      playabilityCache.delete(oldestKey)
    }
  }

  async function analyzePlayability(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return {playable: false, reason: 'missing', videoCodec: null, audioCodec: null, duration: 0}
    }

    const stat = fs.statSync(filePath)
    const cacheKey = getPlayabilityCacheKey(filePath, stat)

    if (playabilityCache.has(cacheKey)) {
      return playabilityCache.get(cacheKey)
    }

    const audioOnly = isAudioFilePath(filePath)
    const probe = await ffprobe(filePath)
    const duration = Number(probe.format?.duration || 0)
    const result = {
      ...analyzeProbeResult(probe, filePath, {audioOnly}),
      duration,
    }
    setPlayabilityCacheEntry(cacheKey, result)
    return result
  }

  async function getPlaybackPlan(filePath, options = {}) {
    const settings = options.settings || await getTranscodeSettings(db)
    const transcodeEnabled = options.transcodeEnabled ?? isTranscodeEnabled(settings)

    if (!filePath || !fs.existsSync(filePath)) {
      return {
        mode: 'missing',
        transcodeRequired: false,
        transcodeStatus: 'none',
        progress: 100,
        error: 'File not found',
        reason: 'missing',
      }
    }

    const playability = await analyzePlayability(filePath)

    if (playability.playable) {
      return {
        mode: 'direct',
        transcodeRequired: false,
        transcodeEnabled,
        transcodeStatus: 'none',
        progress: 100,
        error: null,
        reason: playability.reason,
        playability,
      }
    }

    if (!transcodeEnabled) {
      return {
        mode: 'unsupported',
        transcodeRequired: false,
        transcodeEnabled: false,
        transcodeStatus: 'disabled',
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

    const playability = await analyzePlayability(filePath)
    const fileDuration = Number(playability.duration || 0)
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

    liveStreams.stopStream(cacheInfo.cacheKey)
    return true
  }

  function stopAllLiveStreams() {
    liveStreams.stopAll()
    return true
  }

  async function getTranscodeStatus(filePath) {
    const plan = await getPlaybackPlan(filePath)
    return {
      mode: plan.mode,
      transcodeRequired: plan.transcodeRequired,
      transcodeEnabled: plan.transcodeEnabled ?? true,
      streamPlayback: plan.streamPlayback ?? plan.mode === 'stream',
      status: plan.transcodeStatus,
      progress: plan.progress,
      error: plan.error,
      reason: plan.reason,
    }
  }

  return {
    analyzePlayability,
    getPlaybackPlan,
    resolveStreamPath,
    streamLive,
    stopLiveStream,
    stopAllLiveStreams,
    getTranscodeStatus,
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
  isAudioFilePath,
}
