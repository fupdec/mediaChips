import type { FfprobeInfo } from '../types/tasks'
import type { AnyRecord, ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import fs from 'fs'
import path from 'path'
import { machineId } from 'node-machine-id'
import { extractVideoFrame, ffprobe } from '../utils/ffmpeg'
import { resolveExistingPath } from '../services/contentHash'
import { normalizeMediaPath } from '../utils/normalizeUserPath'
import { getAppConfigPath } from '../utils/appConfigPath'
import {
  getVideoImagesGenerationStatus,
  iterateVideoImagesGeneration,
} from '../services/videoImagesGeneration'
import type { VideoImageType } from '../types/videoImagesGeneration'
import {
  getImageThumbsGenerationStatus,
  iterateImageThumbsGeneration,
} from '../services/imageThumbsGeneration'
import { loadConfigFile, createDefaultConfig } from '../../app/server/configFile'
import { getImageMetadata, createImageThumb } from '../services/imageMedia'

export default function taskVideoCoreController(db: ApiDb) {
  const getDbPath = () => db.path!

  const createStreamAbortSignal = (req: ApiRequest, res: ApiResponse) => {
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

  const checkFileExists = async (req: ApiRequest, res: ApiResponse) => {
    const filePath = normalizeMediaPath(req.body.path)
    const resolved = filePath ? await resolveExistingPath(filePath) : null
    if (resolved) res.sendStatus(201)
    else res.sendStatus(400)
  }

  const getConfig = async (req: ApiRequest, res: ApiResponse) => {
    try {
      const configPath = getAppConfigPath()
      const result = loadConfigFile(configPath)
      const configJson = result.config || createDefaultConfig()
      res.status(200).json(configJson)
    } catch (error) {
      res.status(500).json({message: apiErrorMessage(error) || 'Failed to read config'})
    }
  }

  const getMachineId = async (req: ApiRequest, res: ApiResponse) => {
    try {
      const id = await machineId()
      res.status(200).send(id)
    } catch (error) {
      console.error('getMachineId failed:', error)
      res.status(500).send({message: 'Failed to get machine id'})
    }
  }

  const createTimeline = async (req: ApiRequest, res: ApiResponse) => {
    const timelinesPath = path.join(getDbPath(), 'media', 'videos', 'timelines')
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
      video: AnyRecord

      constructor(videoItem: AnyRecord) {
        this.video = videoItem
      }

      getVideoDuration(pathToFile: string) {
        return ffprobe(pathToFile).then((info) => (info as FfprobeInfo).format.duration)
      }

      createFrame(timestamp: string, output: string) {
        return extractVideoFrame({
          input: String(this.video.path),
          output,
          timestamp,
          vf: 'scale=-1:180',
        }).then((frameOutput: unknown) => new Promise((resolve) => {
          setTimeout(() => resolve(frameOutput), 500)
        }))
      }

      async generate() {
        const parts = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
        const duration = await this.getVideoDuration(String(this.video.path))
        if (typeof duration !== 'number') return false
        const timestamps = parts.map((i: number) => (
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

  const imageThumbsGenerationStatus = async (req: ApiRequest, res: ApiResponse) => {
    try {
      const status = await getImageThumbsGenerationStatus(db, getDbPath())
      res.status(201).send(status)
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while checking image thumbnails generation status.',
      })
    }
  }

  const streamImageThumbsGeneration = async (req: ApiRequest, res: ApiResponse) => {
    const writeEvent = (event: Record<string, unknown>) => {
      res.write(`${JSON.stringify(event)}\n`)
    }

    try {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('X-Accel-Buffering', 'no')

      const shouldStop = createStreamAbortSignal(req, res)

      for await (const event of iterateImageThumbsGeneration(db, getDbPath(), {
        getImageMetadata,
        createImageThumb: createImageThumb as unknown as (path: string, id: unknown, dbPath: string) => Promise<void>,
      }, {
        shouldStop,
        force: String(req.query.force || '').toLowerCase() === 'true',
      })) {
        writeEvent(event as unknown as Record<string, unknown>)
      }

      res.end()
    } catch (err) {
      writeEvent({
        type: 'error',
        message: apiErrorMessage(err) || 'Some error occurred while generating image thumbnails.',
      })
      res.end()
    }
  }

  const videoImagesGenerationStatus = async (req: ApiRequest, res: ApiResponse) => {
    try {
      const status = await getVideoImagesGenerationStatus(db, getDbPath())
      res.status(201).send(status)
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while checking video images generation status.',
      })
    }
  }

  const streamVideoImagesGeneration = async (req: ApiRequest, res: ApiResponse) => {
    const imageType = String(req.query.type || '').toLowerCase() as VideoImageType
    const writeEvent = (event: Record<string, unknown>) => {
      res.write(`${JSON.stringify(event)}\n`)
    }

    try {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('X-Accel-Buffering', 'no')

      const shouldStop = createStreamAbortSignal(req, res)

      for await (const event of iterateVideoImagesGeneration(db, getDbPath(), imageType, {
        shouldStop,
        force: String(req.query.force || '').toLowerCase() === 'true',
      })) {
        writeEvent(event as unknown as Record<string, unknown>)
      }

      res.end()
    } catch (err) {
      writeEvent({
        type: 'error',
        message: apiErrorMessage(err) || 'Some error occurred while generating video images.',
      })
      res.end()
    }
  }

  return {
    checkFileExists,
    getConfig,
    getMachineId,
    createTimeline,
    imageThumbsGenerationStatus,
    streamImageThumbsGeneration,
    videoImagesGenerationStatus,
    streamVideoImagesGeneration,
  }
}
