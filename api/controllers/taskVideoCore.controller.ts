const fs = require('fs')
const path = require('path')
const {machineId} = require('node-machine-id')
const {extractVideoFrame, ffprobe} = require('../utils/ffmpeg')
const {resolveExistingPath} = require('../services/contentHash')
const {normalizeMediaPath} = require('../utils/normalizeUserPath')
const {getAppConfigPath} = require('../utils/appConfigPath')
const {
  getVideoImagesGenerationStatus,
  iterateVideoImagesGeneration,
} = require('../services/videoImagesGeneration')

module.exports = function taskVideoCoreController(db) {
  const dbPath = db.path

  const createStreamAbortSignal = (req, res) => {
    let stopped = false
    const stop = () => {
      stopped = true
    }

    req.on('aborted', stop)
    res.on('close', () => {
      if (!res.writableFinished) {
        stop()
      }
    })

    return () => stopped
  }

  const checkFileExists = async (req, res) => {
    const filePath = normalizeMediaPath(req.body.path)
    const resolved = filePath ? await resolveExistingPath(filePath) : null
    if (resolved) res.sendStatus(201)
    else res.sendStatus(400)
  }

  const getConfig = async (req, res) => {
    try {
      const configPath = getAppConfigPath()
      const configJson = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      res.status(200).json(configJson)
    } catch (error) {
      res.status(500).json({message: error.message || 'Failed to read config'})
    }
  }

  const getMachineId = async (req, res) => {
    try {
      const id = await machineId()
      res.status(200).send(id)
    } catch (error) {
      console.error('getMachineId failed:', error)
      res.status(500).send({message: 'Failed to get machine id'})
    }
  }

  const createTimeline = async (req, res) => {
    const timelinesPath = path.join(dbPath, 'media', 'videos', 'timelines')
    if (!fs.existsSync(timelinesPath)) {
      fs.mkdirSync(timelinesPath, {recursive: true})
    }

    const resolvedVideoPath = await resolveExistingPath(req.body.path)
    if (!resolvedVideoPath) {
      res.status(400).send({message: 'The video does not exist.'})
      return
    }

    const video = {...req.body, path: resolvedVideoPath}

    class Timeline {
      video: Record<string, any>

      constructor(videoItem: Record<string, any>) {
        this.video = videoItem
      }

      getVideoDuration(pathToFile) {
        return ffprobe(pathToFile).then((info) => info.format.duration)
      }

      createFrame(timestamp, output) {
        return extractVideoFrame({
          input: this.video.path,
          output,
          timestamp,
          vf: 'scale=-1:180',
        }).then((frameOutput) => new Promise((resolve) => {
          setTimeout(() => resolve(frameOutput), 500)
        }))
      }

      async generate() {
        const parts = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
        const duration = await this.getVideoDuration(this.video.path)
        if (typeof duration !== 'number') return false
        const timestamps = parts.map((i) => (
          new Date(Math.floor(duration * (i / 100) * 1000)).toISOString().substr(11, 8)
        ))
        const framePromises = timestamps.map((timestamp, index) => {
          const output = path.join(timelinesPath, `${this.video.id}_${parts[index]}.jpg`)
          return this.createFrame(timestamp, output)
        })
        return Promise.all(framePromises)
      }
    }

    const lastFrame = path.join(timelinesPath, `${video.id}_95.jpg`)
    if (fs.existsSync(lastFrame)) {
      res.status(400).send({message: 'Timeline already exists'})
      return
    }

    try {
      const result = await new Timeline(video).generate()
      if (result) {
        res.status(201).send(result)
      } else {
        res.status(400).send({message: 'Timeline already exists'})
      }
    } catch (error) {
      res.status(400).send({message: error})
    }
  }

  const videoImagesGenerationStatus = async (req, res) => {
    try {
      const status = await getVideoImagesGenerationStatus(db, dbPath)
      res.status(201).send(status)
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while checking video images generation status.',
      })
    }
  }

  const streamVideoImagesGeneration = async (req, res) => {
    const imageType = String(req.query.type || '').toLowerCase()
    const writeEvent = (event) => {
      res.write(`${JSON.stringify(event)}\n`)
    }

    try {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('X-Accel-Buffering', 'no')

      const shouldStop = createStreamAbortSignal(req, res)

      for await (const event of iterateVideoImagesGeneration(db, dbPath, imageType, {
        shouldStop,
        force: String(req.query.force || '').toLowerCase() === 'true',
      })) {
        writeEvent(event)
      }

      res.end()
    } catch (err) {
      writeEvent({
        type: 'error',
        message: err.message || 'Some error occurred while generating video images.',
      })
      res.end()
    }
  }

  return {
    checkFileExists,
    getConfig,
    getMachineId,
    createTimeline,
    videoImagesGenerationStatus,
    streamVideoImagesGeneration,
  }
}
