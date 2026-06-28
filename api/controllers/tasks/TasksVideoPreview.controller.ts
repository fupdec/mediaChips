import type { TaskControllerShared } from '../../types/tasks'
import type { ApiRequest, ApiResponse } from '../../types/http'
import type {
  FfprobeDurationInfo,
  VideoGridOptions,
  VideoTimelineItem,
} from '../../types/videoImagesGeneration'

const os = require('os')
const fs = require('fs')
const axios = require('axios')
const path = require('path')
const {
  combineVideoFrames,
  extractVideoFrame,
  ffprobe,
} = require('../../utils/ffmpeg')
const {resolveExistingPath} = require('../../services/contentHash')
const {resolveActiveDbFilePath} = require('../../services/mediaPathResolver')

const formatMarkTimestamp = (time: number) => new Date(1000 * time).toISOString().substr(11, 12)

module.exports = function createTasksVideoPreviewController(shared: TaskControllerShared) {
  const {db, dbPath, createThumbMiddle, createThumbCustom, getImageMedia} = shared

  const createThumbForVideo = async function (req: ApiRequest, res: ApiResponse) {
    createThumbMiddle(req.body.path, req.body.id)
      .then((result: string) => {
        res.status(201).send(result)
      })
      .catch((e: unknown) => {
        res.status(400).send(e)
      })
  }

  const createThumb = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const resolvedInputPath = resolveActiveDbFilePath(req.body.inputPath, dbPath)
      if (!resolvedInputPath) {
        res.status(400).send({
          message: "The video does not exist."
        })
        return
      }

      const outputPath = req.body.outputPath
      if (!outputPath) {
        res.status(400).send({
          message: "No output path provided."
        })
        return
      }

      const outputExists = await resolveExistingPath(outputPath)
      if (!req.body.overwrite && outputExists) {
        res.status(400).send({
          message: "The image already exists."
        })
        return
      }

      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true})
      }

      const thumbResult = await createThumbCustom(
        req.body.timestamp,
        resolvedInputPath,
        outputPath,
        req.body.width,
      )
      res.status(201).send(thumbResult)
    } catch (e) {
      res.status(400).send(e)
    }
  }

  const createGrid = async function (req: ApiRequest, res: ApiResponse) {
    const gridsPath = path.join(dbPath, "/media/videos/grids/");

    if (!fs.existsSync(req.body.input)) {
      res.status(400).send({
        message: "The video does not exist."
      })
      return
    }

    class Grid {
      tmpDir: string
      input: string
      output: string
      cols: number
      rows: number
      width: number
      tileCount: number

      constructor(opts: VideoGridOptions) {
        this.tmpDir = os.tmpdir()
        this.input = opts.input
        this.output = opts.output
        this.cols = opts.cols
        this.rows = opts.rows
        this.width = opts.width
        this.tileCount = this.rows * this.cols
      }

      getVideoDuration(pathToFile: string) {
        return ffprobe(pathToFile).then((info: FfprobeDurationInfo) => info.format.duration)
      }

      makeLayout(i: number) {
        const currentColumn = i % this.cols
        const currentRow = Math.floor(i / this.cols)
        let colSide: string[] = []
        let rowSide: string[] = []
        if (currentColumn === 0) colSide.push('0')
        else
          for (var j = 0; j < currentColumn; j++) colSide.push('w0')
        if (currentRow === 0) rowSide.push('0')
        else
          for (var k = 0; k < currentRow; k++) rowSide.push('h0')
        return `${colSide.join('+')}_${rowSide.join('+')}`
      }

      async ffmpegSeekP(timestamp: string, intermediateOutput: string) {
        return extractVideoFrame({
          input: this.input,
          output: intermediateOutput,
          timestamp,
        }).then((output: unknown) => new Promise((resolve) => {
          setTimeout(() => {
            resolve(output)
          }, 500)
        }))
      }

      async ffmpegCombineP(inputFiles: string[], streams: string[], layouts: string[]) {
        return combineVideoFrames({
          inputs: inputFiles,
          filterComplex: `${streams.join('')}xstack=inputs=${this.tileCount}:layout=${layouts.join('|')}[v];[v]scale=${Math.floor(this.width * this.cols)}:-1[scaled]`,
          output: path.join(gridsPath, this.output),
        })
      }

      async generate() {
        const duration = await this.getVideoDuration(this.input)
        if (typeof duration !== 'number') return false
        const durSlice = parseInt(String(duration / this.tileCount), 10)

        let framePromises: Promise<unknown>[] = []
        for (var i = 0; i < this.tileCount; i++) {
          const timestamp = new Date(1000 * (i + 0.5) * durSlice).toISOString().substr(11, 8)
          const intermediateOutput = path.join(this.tmpDir, `thumb${i}.png`)
          framePromises.push(this.ffmpegSeekP(timestamp, intermediateOutput))
        }

        await Promise.all(framePromises)
          .catch((err: unknown) => {
            // console.log(err)
          })

        let inputFiles: string[] = []
        let streams: string[] = []
        let layouts: string[] = []
        for (var l = 0; l < this.tileCount; l++) {
          inputFiles.push(`${this.tmpDir}/thumb${l}.png`)
          streams.push(`[${l}:v]`)
          layouts.push(this.makeLayout(l))
        }
        await this.ffmpegCombineP(inputFiles, streams, layouts)
          .catch((err: unknown) => {
            console.log(err)
          })

        return {
          output: this.output
        }
      }
    }

    const gridPath = path.join(gridsPath, req.body.output);
    if (!fs.existsSync(gridPath)) {
      const grid = new Grid(req.body)
      const result = await grid.generate()
      if (result) {
        res.status(201).send(result)
      } else {
        res.status(400).send({
          message: 'Grid already exists'
        });
      }
    } else {
      res.status(400).send({
        message: 'Grid already exists'
      });
    }
  }

  const createTimeline = async function (req: ApiRequest, res: ApiResponse) {
    const timelinesPath = path.join(dbPath, 'media', 'videos', 'timelines')
    if (!fs.existsSync(timelinesPath)) {
      fs.mkdirSync(timelinesPath, {recursive: true})
    }

    const resolvedVideoPath = await resolveExistingPath(req.body.path)
    if (!resolvedVideoPath) {
      res.status(400).send({
        message: "The video does not exist."
      })
      return
    }

    const video: VideoTimelineItem = {...req.body, path: resolvedVideoPath}

    class Timeline {
      video: VideoTimelineItem

      constructor(videoItem: VideoTimelineItem) {
        this.video = videoItem
      }

      getVideoDuration(pathToFile: string) {
        return ffprobe(pathToFile).then((info: FfprobeDurationInfo) => info.format.duration)
      }

      createFrame(timestamp: string, output: string) {
        return extractVideoFrame({
          input: this.video.path,
          output,
          timestamp,
          vf: 'scale=-1:180',
        }).then((frameOutput: unknown) => new Promise((resolve) => {
          setTimeout(() => {
            resolve(frameOutput)
          }, 500)
        }))
      }

      async generate() {
        const parts = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
        const duration = await this.getVideoDuration(this.video.path)
        if (typeof duration !== 'number') return false
        const timestamps = parts.map((part) => (new Date(Math.floor(duration * (part / 100) * 1000)).toISOString().substr(11, 8)))
        let framePromises: Promise<unknown>[] = []

        for (let i = 0; i < timestamps.length; i++) {
          let output = path.join(timelinesPath, `${this.video.id}_${parts[i]}.jpg`)
          framePromises.push(this.createFrame(timestamps[i], output))
        }

        const result = await Promise.all(framePromises)
        return result
      }
    }

    const lastFrame = path.join(timelinesPath, `${video.id}_95.jpg`);
    if (!fs.existsSync(lastFrame)) {
      const timeline = new Timeline(video)
      let result
      try {
        result = await timeline.generate()
      } catch (error) {
        res.status(400).send({
          message: error
        });
        return
      }

      if (result) {
        res.status(201).send(result)
      } else {
        res.status(400).send({
          message: 'Timeline already exists'
        });
      }
    } else {
      res.status(400).send({
        message: 'Timeline already exists'
      });
    }
  }

  const createImage = async function (req: ApiRequest, res: ApiResponse) {
    try {
      let buf = Buffer.from(req.body.image, 'base64')
      const {outputPath, url, sizes} = req.body

      if (url) {
        const response = await axios.get(url, {responseType: 'arraybuffer'})
        buf = Buffer.from(response.data)
      }

      const result = await getImageMedia().processAndSaveImage({
        buffer: buf,
        outputPath,
        sizes,
      })
      res.status(201).send({outputPath: result})
    } catch (e) {
      console.log(e)
      res.status(202).send(e)
    }
  }

  const createMarkThumbForMark = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const markId = Number(req.body.markId)
      const mediaId = Number(req.body.mediaId)

      if (!markId || !mediaId) {
        res.status(400).send({message: 'markId and mediaId are required'})
        return
      }

      const mark = await db.Mark.findOne({
        where: {id: markId, mediaId},
        raw: true,
      })

      if (!mark) {
        res.status(404).send({message: 'Mark not found'})
        return
      }

      const media = await db.Media.findOne({
        where: {id: mediaId},
        raw: true,
      })

      if (!media?.path) {
        res.status(404).send({message: 'Media not found'})
        return
      }

      const resolvedInputPath = resolveActiveDbFilePath(media.path, dbPath)
      if (!resolvedInputPath) {
        res.status(400).send({message: 'The video does not exist.'})
        return
      }

      const marksDir = path.join(dbPath, 'media/videos/marks')
      if (!fs.existsSync(marksDir)) {
        fs.mkdirSync(marksDir, {recursive: true})
      }

      const outputPath = path.join(marksDir, `${markId}.jpg`)
      if (!req.body.overwrite && fs.existsSync(outputPath)) {
        res.status(400).send({message: 'The image already exists.'})
        return
      }

      await createThumbCustom(
        formatMarkTimestamp(Number(mark.time)),
        resolvedInputPath,
        outputPath,
        180,
      )
      res.status(201).send('success')
    } catch (e) {
      res.status(400).send(e)
    }
  }

  return {
    createThumbForVideo,
    createThumb,
    createMarkThumbForMark,
    createGrid,
    createTimeline,
    createImage,
  }
}
