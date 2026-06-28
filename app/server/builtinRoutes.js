const path = require('path')
const fs = require('fs')
const package_json = require('../../package.json')
const {normalizeMediaPath} = require('../../api/utils/normalizeUserPath')
const {isLoopbackHost} = require('./constants')
const {isClientAbortError, safeJsonError} = require('./fileResolver')
const {streamVideoFile} = require('../../api/services/transcode/streamVideoFile')

function resolveMediaVideoPath(db, resolveFilePath, mediaId) {
  return db.Media.findOne({
    where: {id: mediaId},
  }).then((video) => {
    if (!video || !video.path) {
      return {error: {status: 404, body: {message: 'Video not found in database'}}}
    }

    const videoPath = resolveFilePath(video.path)
    if (!videoPath || !fs.existsSync(videoPath)) {
      return {error: {status: 404, body: {message: "Video file doesn't exist"}}}
    }

    return {video, videoPath}
  })
}

function registerBuiltinRoutes({
  app,
  router,
  config,
  configPath,
  databasesPath,
  db,
  routeLoadErrors,
  resolveFilePath,
  getStreamContentType,
  transcodeManager,
}) {
  app.get('/api/health', (req, res) => {
    console.log('Health check from:', req.headers.origin || 'unknown origin')
    res.json({
      status: 'online',
      service: 'mediachips-server',
      version: package_json.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      ip: 'localhost',
      port: config.port,
      taskRoutesLoaded: !routeLoadErrors.some((entry) => entry.routeFile === 'Task.routes'),
      routeLoadErrors,
    })
  })

  app.get('/api/ping', (req, res) => {
    res.json({
      pong: Date.now(),
      ip: 'localhost',
      port: config.port,
      message: 'Server is online',
    })
  })

  app.get('/api/getMachineId', async (req, res) => {
    try {
      const {machineId} = require('node-machine-id')
      const id = await machineId()
      res.status(200).send(id)
    } catch (error) {
      console.error('getMachineId failed:', error)
      res.status(500).json({message: 'Failed to get machine id'})
    }
  })

  app.get('/api/config', (req, res) => {
    console.log('Config request from:', req.headers.origin || 'unknown origin')

    const activeDb = config.databases.find(db => db.active)
    const requestHostname = req.hostname
    const frontendIp = requestHostname && !isLoopbackHost(requestHostname)
      ? requestHostname
      : config.ip

    const responseConfig = {
      ip: frontendIp,
      ips: config.ips,
      hostname: config.hostname,
      port: config.port,
      appVersion: package_json.version || '1.0.0',
      path: activeDb ? path.join(databasesPath, activeDb.id) : '',
      databases: config.databases || [],
      activeDatabase: activeDb,
      serverInfo: {
        webUrl: `http://${frontendIp}:${config.port}`,
        apiUrl: `http://${frontendIp}:${config.port}/api`,
        wsUrl: `ws://${frontendIp}:${config.port}`,
        detectedAt: new Date().toISOString(),
      },
    }

    res.json(responseConfig)
  })

  app.post('/api/update-config', (req, res) => {
    Object.assign(config, req.body)

    const activeDb = config.databases.find(db => db.active)
    if (activeDb) {
      config.path = path.join(databasesPath, activeDb.id)
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.log('\x1b[36m%s\x1b[0m', `Config updated. Active database: ${activeDb?.name || 'none'}`)

    res.json({success: true, message: 'Configuration updated'})
  })

  app.post('/api/get-file', (req, res) => {
    console.log('=== FILE REQUEST ===')
    console.log('Request body:', req.body)

    const originalFilePath = req.body.url

    if (!originalFilePath) {
      return res.status(400).json({error: 'No file path provided'})
    }

    try {
      const resolvedPath = resolveFilePath(originalFilePath)

      if (!resolvedPath) {
        console.error('File not found:', originalFilePath)
        return res.status(404).json({
          error: 'File not found',
          resolved: false,
        })
      }

      console.log('Sending file:', resolvedPath)

      const ext = path.extname(resolvedPath).toLowerCase()
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
      }

      const contentType = mimeTypes[ext] || 'application/octet-stream'

      res.setHeader('Content-Type', contentType)
      res.setHeader('Cache-Control', 'public, max-age=86400')
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')

      res.sendFile(resolvedPath, (err) => {
        if (!err) return

        if (isClientAbortError(err) || req.aborted || res.writableEnded) {
          return
        }

        console.error('Error sending file:', err)

        if (res.headersSent) return

        try {
          const stats = fs.statSync(resolvedPath)
          const fileStream = fs.createReadStream(resolvedPath)

          fileStream.on('error', (streamErr) => {
            if (!isClientAbortError(streamErr)) {
              console.error('File stream error:', streamErr)
            }
            safeJsonError(res, req, 500, {
              error: 'File stream error',
              details: streamErr.message,
            })
          })

          req.on('close', () => {
            fileStream.destroy()
          })

          res.setHeader('Content-Length', stats.size)
          fileStream.pipe(res)
        } catch (streamErr) {
          safeJsonError(res, req, 500, {
            error: 'File stream error',
            details: streamErr.message,
          })
        }
      })
    } catch (err) {
      console.error('Error processing file:', err)
      safeJsonError(res, req, 500, {error: 'Server error', details: err.message})
    }
  })

  app.post('/api/check-file', (req, res) => {
    const filePath = req.body.url

    if (!filePath) {
      return res.json({exists: false, error: 'No path provided'})
    }

    const resolvedPath = resolveFilePath(filePath)
    res.json({
      exists: !!resolvedPath,
    })
  })

  app.post('/api/switch-database', (req, res) => {
    const {databaseId} = req.body

    if (!databaseId) {
      return res.status(400).json({error: 'Database ID required'})
    }

    const database = config.databases.find(db => db.id === databaseId)
    if (!database) {
      return res.status(404).json({error: 'Database not found'})
    }

    config.databases.forEach(db => {
      db.active = false
    })

    database.active = true
    config.path = path.join(databasesPath, database.id)

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

    res.json({
      success: true,
      message: `Database switched to ${database.name}`,
      databaseId: database.id,
      databaseName: database.name,
    })
  })

  app.post('/api/resolve-path', (req, res) => {
    const {filePath} = req.body

    if (!filePath) {
      return res.json({error: 'No file path provided'})
    }

    const resolvedPath = resolveFilePath(filePath)
    const normalizedPath = normalizeMediaPath(filePath)

    const results = []
    for (const dbEntry of config.databases) {
      const cleanPath = normalizedPath
        .replace(/^\/+/, '')
        .replace(/^.*(?:databases|app_storage)[\\/]+[a-f0-9]{12}[\\/]+/i, '')

      const possiblePaths = [
        path.join(databasesPath, dbEntry.id, 'media', cleanPath),
        path.join(databasesPath, dbEntry.id, cleanPath),
        path.join(databasesPath, dbEntry.id, 'meta', cleanPath),
      ]

      for (const possiblePath of possiblePaths) {
        const exists = fs.existsSync(possiblePath)
        if (exists) {
          results.push({
            databaseId: dbEntry.id,
            databaseName: dbEntry.name,
            active: dbEntry.active,
            exists: true,
          })
        }
      }
    }

    res.json({
      exists: !!resolvedPath,
      results,
    })
  })

  router.get('/api/video/:id/playable', async (req, res) => {
    if (!transcodeManager) {
      return res.json({
        mode: 'direct',
        url: `/api/video/${req.params.id}?source=direct`,
        transcodeRequired: false,
        transcodeStatus: 'none',
        progress: 100,
        error: null,
      })
    }

    try {
      const resolved = await resolveMediaVideoPath(db, resolveFilePath, req.params.id)
      if (resolved.error) {
        return res.status(resolved.error.status).json(resolved.error.body)
      }

      const plan = await transcodeManager.getPlaybackPlan(resolved.videoPath)
      let url = `/api/video/${req.params.id}?source=auto`

      if (plan.streamPlayback) {
        url = `/api/video/${req.params.id}/transcode/stream`
      }

      res.json({
        mode: plan.mode,
        url,
        transcodeRequired: plan.transcodeRequired,
        transcodeStatus: plan.transcodeStatus,
        streamPlayback: plan.streamPlayback,
        progress: plan.progress,
        error: plan.error,
        reason: plan.reason,
        playability: plan.playability,
      })
    } catch (err) {
      console.error('Playable check error:', err)
      safeJsonError(res, req, 500, {message: err.message || 'Failed to analyze video'})
    }
  })

  router.delete('/api/transcode/streams', (req, res) => {
    if (!transcodeManager) {
      return res.json({stopped: false})
    }

    try {
      transcodeManager.stopAllLiveStreams()
      res.json({stopped: true})
    } catch (err) {
      console.error('Live transcode stop-all error:', err)
      safeJsonError(res, req, 500, {message: err.message || 'Failed to stop live transcode streams'})
    }
  })

  router.delete('/api/video/:id/transcode/stream', async (req, res) => {
    if (!transcodeManager) {
      return res.json({stopped: false})
    }

    try {
      const resolved = await resolveMediaVideoPath(db, resolveFilePath, req.params.id)
      if (resolved.error) {
        return res.status(resolved.error.status).json(resolved.error.body)
      }

      const stopped = transcodeManager.stopLiveStream(resolved.videoPath)
      res.json({stopped})
    } catch (err) {
      console.error('Live transcode stop error:', err)
      safeJsonError(res, req, 500, {message: err.message || 'Failed to stop live transcode stream'})
    }
  })

  router.get('/api/video/:id/transcode/stream', async (req, res) => {
    if (!transcodeManager) {
      return res.status(503).json({message: 'Transcoding is unavailable'})
    }

    try {
      const resolved = await resolveMediaVideoPath(db, resolveFilePath, req.params.id)
      if (resolved.error) {
        return res.status(resolved.error.status).json(resolved.error.body)
      }

      const startTime = Math.max(0, Number(req.query.start) || 0)
      await transcodeManager.streamLive(req, res, resolved.videoPath, {startTime})
    } catch (err) {
      console.error('Live transcode stream error:', err)
      safeJsonError(res, req, 500, {message: err.message || 'Failed to start live transcode stream'})
    }
  })

  router.get('/api/video/:id/transcode/status', async (req, res) => {
    if (!transcodeManager) {
      return res.json({status: 'none', progress: 100, error: null})
    }

    try {
      const resolved = await resolveMediaVideoPath(db, resolveFilePath, req.params.id)
      if (resolved.error) {
        return res.status(resolved.error.status).json(resolved.error.body)
      }

      const status = await transcodeManager.getTranscodeStatus(resolved.videoPath)
      res.json(status)
    } catch (err) {
      console.error('Transcode status error:', err)
      safeJsonError(res, req, 500, {message: err.message || 'Failed to get transcode status'})
    }
  })

  router.post('/api/video/:id/transcode/start', async (req, res) => {
    res.status(410).json({
      status: 'stream',
      progress: 0,
      mode: 'stream',
      message: 'Full-file transcode is disabled. Use live chunk streaming.',
    })
  })

  router.get('/api/transcode/cache', (req, res) => {
    if (!transcodeManager) {
      return res.json({bytes: 0, files: 0, entries: 0})
    }

    try {
      res.json(transcodeManager.getCacheStatsForActiveDb())
    } catch (err) {
      console.error('Transcode cache stats error:', err)
      safeJsonError(res, req, 500, {message: err.message || 'Failed to read transcode cache stats'})
    }
  })

  router.delete('/api/transcode/cache', (req, res) => {
    if (!transcodeManager) {
      return res.json({removed: 0, bytes: 0})
    }

    try {
      const result = transcodeManager.clearCacheForActiveDb()
      res.json(result)
    } catch (err) {
      console.error('Transcode cache clear error:', err)
      safeJsonError(res, req, 500, {message: err.message || 'Failed to clear transcode cache'})
    }
  })

  router.get('/api/video/:id', async (req, res) => {
    const source = String(req.query.source || 'auto').toLowerCase()

    try {
      const resolved = await resolveMediaVideoPath(db, resolveFilePath, req.params.id)
      if (resolved.error) {
        return res.status(resolved.error.status).json(resolved.error.body)
      }

      let streamPath = resolved.videoPath
      let contentType = getStreamContentType(resolved.videoPath)

      if (transcodeManager) {
        const streamInfo = await transcodeManager.resolveStreamPath(resolved.videoPath, source)
        if (streamInfo.filePath) {
          streamPath = streamInfo.filePath
          contentType = streamInfo.contentType || contentType
        } else if (source !== 'direct') {
          return res.status(409).json({
            message: 'Transcoded video is not ready',
            transcodeStatus: streamInfo.plan?.transcodeStatus || 'pending',
            progress: streamInfo.plan?.progress || 0,
          })
        }
      }

      streamVideoFile(req, res, streamPath, contentType)
    } catch (err) {
      console.error('Video streaming error:', err)
      safeJsonError(res, req, 500, {message: err.message || 'Database error'})
    }
  })
}

module.exports = {
  registerBuiltinRoutes,
}
