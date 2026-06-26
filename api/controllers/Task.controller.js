const os = require('os')
const fs = require("fs")
const axios = require('axios')
const path = require('path')
const { rimraf } = require("rimraf")
const {
  combineVideoFrames,
  extractVideoFrame,
  extractVideoThumbnail,
  ffprobe,
} = require('../utils/ffmpeg')
const {
  readdir,
  lstat,
  stat
} = require('fs/promises')
const {exec} = require("child_process");
const {machineId} = require("node-machine-id");
const {tokenizeFilePath} = require('../services/pathTokenizer')
const {matchPathToTags} = require('../services/pathTagMatcher')
const {suggestTagsFromMedia} = require('../services/tagSuggester')
const {getAppConfigPath} = require('../utils/appConfigPath')
const {isVideoMediaType, isImageMediaType, isAudioMediaType} = require('../utils/mediaType')
const {computeContentHashForPath, fileExists, verifyContentHashMatch, resolveExistingPath} = require('../services/contentHash')
const {normalizeMediaPath, pathsEquivalent, buildPathLookupVariants} = require('../utils/normalizeUserPath')
const {
  getContentHashBackfillStatus,
  iterateContentHashBackfill,
} = require('../services/contentHashBackfill')
const {
  getMissingMediaStatus,
  iterateMissingMediaSearch,
} = require('../services/missingMediaFinder')

function lazyService(modulePath) {
  let cached
  return () => {
    if (!cached) cached = require(modulePath)
    return cached
  }
}

const getVideoClipTagger = lazyService('../services/videoClipTagger')
const getEmbeddingModel = lazyService('../services/embeddingModel')
const getImageMedia = lazyService('../services/imageMedia')
const getVideoImagesGeneration = lazyService('../services/videoImagesGeneration')
const getImageThumbsGeneration = lazyService('../services/imageThumbsGeneration')

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

module.exports = function (db) {
  const importSavedFilters = (req, res) => {
    // res.status(201).send(_saved_filters.savedFilters)
  }

  const dbPath = db.path

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
  const Op = db.Sequelize.Op
  const Sequelize = db.Sequelize

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

  const getParserSettings = async (overrides = {}) => {
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

  const checkFileExists = async function (req, res) {
    const filePath = normalizeMediaPath(req.body.path)
    const resolved = filePath ? await resolveExistingPath(filePath) : null
    if (resolved) res.sendStatus(201)
    else res.sendStatus(400)
  }

  const renameFile = async function (req, res) {
    const { old_path, new_path } = req.body
    const { moveFile, prepareRename, checkRenameDiskSpace } = require('../../app/tasks/moveFile')

    try {
      const prepared = await prepareRename(old_path, new_path)

      if (prepared.error) {
        return res.status(400).send({
          code: prepared.error.code,
          fileName: prepared.fileName,
          folder: prepared.folder,
        })
      }

      if (prepared.skip) {
        return res.sendStatus(201)
      }

      const diskSpaceError = await checkRenameDiskSpace(prepared)
      if (diskSpaceError) {
        return res.status(400).send({
          code: 'NO_SPACE',
          required: diskSpaceError.required,
          available: diskSpaceError.available,
          fileName: prepared.fileName,
          folder: prepared.folder,
        })
      }

      await moveFile(old_path, new_path)
      res.sendStatus(201)
    } catch (error) {
      console.log('ERROR: ' + error.message)
      res.status(400).send({
        code: error.code || 'UNKNOWN',
        message: error.message,
        required: error.required,
        available: error.available,
        fileName: path.basename(new_path),
        folder: path.dirname(new_path),
      })
    }
  }

  const openPath = async function (req, res) {
    let entryPath = path.normalize(req.body.path)
    if (req.body.isDir) entryPath = path.dirname(entryPath)

    const fail = (message) => res.status(400).send({message})

    try {
      const {shell} = require('electron')
      const error = await shell.openPath(entryPath)
      if (error) return fail(error)
      return res.sendStatus(201)
    } catch (_) {
      // Non-Electron environment (e.g. standalone API dev server)
    }

    const command = process.platform === 'darwin'
      ? `open ${JSON.stringify(entryPath)}`
      : process.platform === 'win32'
        ? `start "" ${JSON.stringify(entryPath)}`
        : `xdg-open ${JSON.stringify(entryPath)}`

    exec(command, (err) => {
      if (err) return fail(err.message)
      res.sendStatus(201)
    })
  }

  const getFileList = async function (req, res) {
    async function findInDir(rootDir, regex, excluded) {
      const fileList = []
      const stack = [rootDir]
      let scanned = 0

      while (stack.length) {
        const dir = stack.pop()
        let files

        try {
          files = await readdir(dir, {withFileTypes: true})
        } catch (err) {
          continue
        }

        for (const file of files) {
          const filePath = path.join(dir, file.name)

          if (excluded.some(exclude => filePath.includes(exclude))) {
            continue
          }

          if (file.isDirectory()) {
            stack.push(filePath)
          } else if (file.isFile() && regex.test(filePath.toLowerCase())) {
            fileList.push(filePath)
          }

          scanned += 1
          if (scanned % 500 === 0) {
            await new Promise(resolve => setImmediate(resolve))
          }
        }
      }

      return fileList
    }

    const entryPath = path.join(req.body.path);
    const regexObj = JSON.parse(req.body.filter);
    const excluded = Array.isArray(req.body.excluded) ? req.body.excluded : [];
    const regex = new RegExp(regexObj);

    // getting stat by path
    let fileStat
    try {
      fileStat = await lstat(entryPath)
    } catch (error) {
      res.status(400).send({
        message: error
      })
      return
    }

    // check if file or directory exists
    if (fileStat.isFile() && regex.test(entryPath.toLowerCase())) {
      res.status(201).send([entryPath])
      return
    } else if (!fileStat.isDirectory()) {
      res.status(400).send({
        message: "not directory"
      })
      return
    }

    let fileList = await findInDir(entryPath, regex, excluded)
    res.status(201).send(fileList)
  }

  const findMediaByPath = async (pathToFile) => {
    const variants = buildPathLookupVariants(pathToFile)

    if (!variants.length) return null

    return db.Media.findOne({
      where: {
        [Op.or]: variants.map((variant) => ({
          path: Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('path')),
            '=',
            variant.toLowerCase(),
          ),
        })),
      },
    })
  }

  const addMediaToDb = async (rawPathToFile, mediaType, is_check_duplicates) => {
    const pathToFile = normalizeMediaPath(rawPathToFile)
    const resolvedPath = await resolveExistingPath(pathToFile)

    if (!resolvedPath) {
      throw new Error(`File not found: ${pathToFile}`)
    }

    let stats = await stat(resolvedPath)
    let filesize = stats.size;

    const existingByPath = await findMediaByPath(pathToFile)

    if (existingByPath) {
      return {
        isCreated: false,
        duplicate: {
          parameter: 'path',
          path: existingByPath.path,
          id: existingByPath.id,
        },
      }
    }

    let contentHash = null
    try {
      contentHash = await computeContentHashForPath(resolvedPath)
    } catch (error) {
      console.error(`Content hash failed for ${pathToFile}:`, error.message)
    }

    if (is_check_duplicates && contentHash) {
      let duplicate_by_hash = await db.Media.findOne({
        where: {contentHash},
      })

      if (!duplicate_by_hash) {
        const legacyCandidates = await db.Media.findAll({
          where: {
            filesize,
            mediaTypeId: mediaType.id,
            [Op.or]: [
              {contentHash: null},
              {contentHash: ''},
            ],
          },
        })

        for (const candidate of legacyCandidates) {
          if (!(await fileExists(candidate.path))) {
            continue
          }

          try {
            const candidateHash = await computeContentHashForPath(candidate.path)
            await candidate.update({contentHash: candidateHash})

            if (candidateHash === contentHash) {
              duplicate_by_hash = candidate
              break
            }
          } catch (error) {
            console.error(`Content hash failed for ${candidate.path}:`, error.message)
          }
        }
      }

      if (duplicate_by_hash && pathsEquivalent(duplicate_by_hash.path, pathToFile)) {
        return {
          isCreated: false,
          duplicate: {
            parameter: 'path',
            path: duplicate_by_hash.path,
            id: duplicate_by_hash.id,
          },
        }
      }

      if (duplicate_by_hash && await fileExists(duplicate_by_hash.path)) {
        const isSameContent = await verifyContentHashMatch(duplicate_by_hash.path, contentHash)

        if (!isSameContent) {
          try {
            const correctedHash = await computeContentHashForPath(duplicate_by_hash.path)
            await duplicate_by_hash.update({contentHash: correctedHash})
          } catch (error) {
            console.error(`Content hash correction failed for ${duplicate_by_hash.path}:`, error.message)
          }

          duplicate_by_hash = null
        }
      }

      if (duplicate_by_hash) {
        const existingPathExists = await fileExists(duplicate_by_hash.path)

        return {
          isCreated: false,
          duplicate: {
            parameter: 'content_hash',
            path: duplicate_by_hash.path,
            id: duplicate_by_hash.id,
            reason: existingPathExists ? 'duplicate' : 'moved',
            new_path: pathToFile,
          },
        }
      }
    }

    const storedPath = resolvedPath

    const defaults = {
      filesize: filesize,
      ext: path.extname(storedPath),
      basename: path.basename(storedPath),
      name: path.parse(storedPath).name,
      mediaTypeId: mediaType.id,
    }

    if (contentHash) {
      defaults.contentHash = contentHash
    }

    const [media, isCreated] = await db.Media.findOrCreate({
      where: {
        path: storedPath,
      },
      defaults,
    })

    if (!isCreated) {
      return {
        media,
        isCreated: false,
        duplicate: {
          parameter: 'path',
          path: media.path,
          id: media.id,
        },
      }
    }

    return {
      media,
      isCreated: true,
      duplicate: false,
    }
  }

  function createThumbMiddle(pathToFile, id) {
    const outputPath = path.join(dbPath, 'media/videos/thumbs', `${id}.jpg`)
    return withTimeout(
      extractVideoThumbnail({input: pathToFile, outputPath, height: 320}),
      120000,
      'ffmpeg thumbnail',
    ).then(() => 'success')
  }

  function createThumbCustom(timestamp, inputPath, outputPath, width) {
    return extractVideoFrame({
      input: inputPath,
      output: outputPath,
      timestamp,
      vf: `scale=-1:${width}`,
    })
  }

  const createThumbForVideo = async function (req, res) {
    createThumbMiddle(req.body.path, req.body.id)
      .then(result => {
        res.status(201).send(result)
      })
      .catch(e => {
        res.status(400).send(e)
      })
  }

  const getVideoMetadata = async (pathToFile) => {
    try {
      const info = await withTimeout(ffprobe(pathToFile), 60000, 'ffprobe')
      if (info.format.duration < 1) {
        throw new Error('duration less than 1 sec.')
      }

      const duration = Math.floor(info.format.duration)

      let width, height, codec, fps
      for (let stream of info.streams) {
        if (stream.codec_type !== 'video') continue
        width = stream.width
        height = stream.height
        codec = stream.codec_name
        fps = Math.ceil(stream.nb_frames / info.format.duration)
        break
      }

      return {
        duration: duration,
        bitrate: info.format.bit_rate,
        width,
        height,
        codec,
        fps,
      }
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const getAudioMetadata = async (pathToFile) => {
    try {
      const info = await withTimeout(ffprobe(pathToFile), 60000, 'ffprobe')
      if (!info?.format?.duration || info.format.duration < 1) {
        throw new Error('duration less than 1 sec.')
      }

      const duration = Math.floor(info.format.duration)

      let codec
      for (const stream of info.streams) {
        if (stream.codec_type !== 'audio') continue
        codec = stream.codec_name
        break
      }

      return {
        duration,
        bitrate: info.format.bit_rate,
        codec,
      }
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const addMediaVideo = async function (req, res) {
    try {
      const pathToFile = req.body.path
      const mediaType = req.body.type
      const is_check_duplicates = req.body.is_check_duplicates

      const {
        media,
        isCreated,
        duplicate,
      } = await addMediaToDb(pathToFile, mediaType, is_check_duplicates)

      if (isCreated) {
        const videoPath = media.path
        const metadata = await getVideoMetadata(videoPath)

        if (metadata) {
          await db.VideoMetadata.create({
            mediaId: media.id,
            duration: metadata.duration,
            bitrate: metadata.bitrate,
            width: metadata.width,
            height: metadata.height,
            codec: metadata.codec,
            fps: metadata.fps,
          })
        }

        try {
          await createThumbMiddle(videoPath, media.id)
        } catch (error) {
          console.error(`Thumbnail generation failed for ${videoPath}:`, error)
        }

        res.status(201).send(media)
      } else {
        res.status(202).send({
          message: "Media already added.",
          duplicate,
        })
      }
    } catch (error) {
      console.error('addMediaVideo failed:', error)
      res.status(400).send({
        message: error.message || String(error),
      })
    }
  };

  const addMediaImage = async function (req, res) {
    const pathToFile = req.body.path
    const mediaType = req.body.type

    const {
      media,
      isCreated,
      duplicate,
    } = await addMediaToDb(pathToFile, mediaType, req.body.is_check_duplicates)

    if (isCreated) {
      const metadata = await withTimeout(
        getImageMedia().getImageMetadata(pathToFile),
        60000,
        'image metadata'
      ).catch(error => {
        console.error(`Image metadata extraction failed for ${pathToFile}:`, error.message)
        return null
      })

      if (metadata) {
        await db.ImageMetadata.create({
          mediaId: media.id,
          width: metadata.width,
          height: metadata.height,
          orientation: metadata.orientation,
        })
      }

      try {
        await withTimeout(
          getImageMedia().createImageThumb(pathToFile, media.id, dbPath),
          120000,
          'image thumbnail'
        )
      } catch (error) {
        console.error(`Thumbnail generation failed for ${pathToFile}:`, error.message)
      }

      res.status(201).send(media)
    } else {
      res.status(202).send({
        message: "Media already added.",
        duplicate,
      })
    }
  };

  const addMediaAudio = async function (req, res) {
    const pathToFile = req.body.path
    const mediaType = req.body.type

    const {
      media,
      isCreated,
      duplicate,
    } = await addMediaToDb(pathToFile, mediaType, req.body.is_check_duplicates)

    if (isCreated) {
      const metadata = await getAudioMetadata(pathToFile)

      if (metadata) {
        await db.VideoMetadata.create({
          mediaId: media.id,
          duration: metadata.duration,
          bitrate: metadata.bitrate,
          codec: metadata.codec,
        })
      }

      res.status(201).send(media)
    } else {
      res.status(202).send({
        message: "Media already added.",
        duplicate,
      })
    }
  };

  const addMediaText = async function (req, res) {
    const {
      media,
      isCreated,
      duplicate,
    } = await addMediaToDb(req.body.path, req.body.type, req.body.is_check_duplicates)

    if (isCreated) {
      res.status(201).send(media)
    } else {
      res.status(202).send({
        message: "Media already added.",
        duplicate,
      })
    }
  };

  // TODO Рефакторинг: объединить методы добавления медиа в один
  const addMedia = async function (req, res) {
    const {
      media,
      isCreated,
      duplicate,
    } = await addMediaToDb(req.body.path, req.body.type, req.body.is_check_duplicates)

    if (isCreated) {
      res.status(201).send(media)
    } else {
      res.status(202).send({
        message: "Media already added.",
        duplicate,
      })
    }
  };

  // TODO Рефакторинг: объединить методы добавления медиа в один
  const updateMediaInfo = async (req, res) => {
    const media_id = req.body.id;

    try {
      const media = await db.Media.findOne({where: {id: media_id}})

      if (media) {
        const mediaType = await db.MediaType.findOne({
          where: {id: media.mediaTypeId},
          raw: true,
        })

        if (isVideoMediaType(mediaType)) {
          const metadata = await getVideoMetadata(media.dataValues.path)

          if (metadata) {
            await db.VideoMetadata.update({
              duration: metadata.duration,
              bitrate: metadata.bitrate,
              width: metadata.width,
              height: metadata.height,
              codec: metadata.codec,
              fps: metadata.fps,
            }, {
              where: {
                mediaId: media_id,
              },
            })
          }
        } else if (isImageMediaType(mediaType)) {
          const metadata = await getImageMedia().getImageMetadata(media.dataValues.path)

          if (metadata) {
            await db.ImageMetadata.upsert({
              mediaId: media_id,
              width: metadata.width,
              height: metadata.height,
              orientation: metadata.orientation,
            })
          }

          try {
            await getImageMedia().createImageThumb(media.dataValues.path, media_id, dbPath)
          } catch (error) {
            console.error(`Thumbnail regeneration failed for media ${media_id}:`, error.message)
          }
        } else if (isAudioMediaType(mediaType)) {
          const metadata = await getAudioMetadata(media.dataValues.path)

          if (metadata) {
            await db.VideoMetadata.upsert({
              mediaId: media_id,
              duration: metadata.duration,
              bitrate: metadata.bitrate,
              codec: metadata.codec,
            })
          }
        }

        let stats = fs.statSync(media.dataValues.path)
        let filesize = stats.size;

        db.Media.update({
          filesize: filesize,
        }, {
          where: {
            id: media_id,
          },
        })
      }

      res.status(201).send('success')
    } catch (error) {
      res.status(202).send(error)
    }
  };

  const createThumb = async function (req, res) {
    /**
     * Creating an image by taking a frame from a video.
     * @param {string} timestamp - time in the video, in the format 00:00:00.
     * @param {string} inputPath - full path to the video file.
     * @param {string} outputPath - full path to the generated image with the extension and file name.
     * @param {number} width - width of thumbnail in pixels.
     */

    if (!fs.existsSync(req.body.inputPath)) {
      res.status(400).send({
        message: "The video does not exist."
      })
      return
    }

    if (!req.body.overwrite && fs.existsSync(req.body.outputPath)) {
      res.status(400).send({
        message: "The image already exists."
      })
      return
    }

    let outputPath = req.body.outputPath
    createThumbCustom(req.body.timestamp, req.body.inputPath, outputPath, req.body.width)
      .then(thumbResult => {
        res.status(201).send(thumbResult)
      })
      .catch(e => {
        res.status(400).send(e)
      })
  };

  const createGrid = async function (req, res) {
    const gridsPath = path.join(dbPath, "/media/videos/grids/");

    if (!fs.existsSync(req.body.input)) {
      res.status(400).send({
        message: "The video does not exist."
      })
      return
    }

    class Grid {
      constructor(opts) {
        this.tmpDir = os.tmpdir()
        this.input = opts.input
        this.output = opts.output
        this.cols = opts.cols
        this.rows = opts.rows
        this.width = opts.width
        this.tileCount = this.rows * this.cols
      }

      getVideoDuration(pathToFile) {
        return ffprobe(pathToFile).then((info) => info.format.duration)
      }

      makeLayout(i) {
        // see https://ffmpeg.org/ffmpeg-filters.html#xstack for the madness
        const currentColumn = i % this.cols
        const currentRow = Math.floor(i / this.cols)
        let colSide = []
        let rowSide = []
        if (currentColumn === 0) colSide.push('0')
        else
          for (var j = 0; j < currentColumn; j++) colSide.push('w0')
        if (currentRow === 0) rowSide.push('0')
        else
          for (var k = 0; k < currentRow; k++) rowSide.push('h0')
        return `${colSide.join('+')}_${rowSide.join('+')}`
      }

      async ffmpegSeekP(timestamp, intermediateOutput) {
        return extractVideoFrame({
          input: this.input,
          output: intermediateOutput,
          timestamp,
        }).then((output) => new Promise((resolve) => {
          setTimeout(() => {
            resolve(output)
          }, 500)
        }))
      }

      async ffmpegCombineP(inputFiles, streams, layouts) {
        return combineVideoFrames({
          inputs: inputFiles,
          filterComplex: `${streams.join('')}xstack=inputs=${this.tileCount}:layout=${layouts.join('|')}[v];[v]scale=${Math.floor(this.width * this.cols)}:-1[scaled]`,
          output: path.join(gridsPath, this.output),
        })
      }

      async generate() {
        const duration = await this.getVideoDuration(this.input)
        if (typeof duration !== 'number') return false
        const durSlice = parseInt(duration / this.tileCount)

        let framePromises = []
        for (var i = 0; i < this.tileCount; i++) {
          const timestamp = new Date(1000 * (i + 0.5) * durSlice).toISOString().substr(11, 8)
          const intermediateOutput = path.join(this.tmpDir, `thumb${i}.png`)
          framePromises.push(this.ffmpegSeekP(timestamp, intermediateOutput))
        }

        await Promise.all(framePromises)
          .catch(err => {
            // console.log(err)
          })

        // combine images together to make tile
        let inputFiles = []
        let streams = []
        let layouts = []
        for (var l = 0; l < this.tileCount; l++) {
          inputFiles.push(`${this.tmpDir}/thumb${l}.png`)
          streams.push(`[${l}:v]`)
          layouts.push(this.makeLayout(l))
        }
        await this.ffmpegCombineP(inputFiles, streams, layouts)
          .catch(err => {
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
  };

  const createTimeline = async function (req, res) {
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

    const video = {...req.body, path: resolvedVideoPath}

    class Timeline {
      constructor(videoItem) {
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
          setTimeout(() => {
            resolve(frameOutput)
          }, 500)
        }))
      }

      async generate() {
        const parts = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
        const duration = await this.getVideoDuration(this.video.path)
        if (typeof duration !== 'number') return false
        const timestamps = parts.map(i => (new Date(Math.floor(duration * (i / 100) * 1000)).toISOString().substr(11, 8)))
        let framePromises = []

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
  };


  const getMachineId = async function (req, res) {
    try {
      const id = await machineId()
      res.status(200).send(id)
    } catch (error) {
      console.error('getMachineId failed:', error)
      res.status(500).send({message: 'Failed to get machine id'})
    }
  };


  const createImage = async function (req, res) {
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
  };

  const deleteFile = async function (req, res) {
    fs.unlink(req.body.path, (err) => {
      if (err) {
        res.status(400).send(err)
      } else {
        res.status(201).send({
          message: 'successfully deleted local file'
        })
      }
    })
  };

  const rmrf = (folder) => rimraf(folder)

  const deleteDb = async function (req, res) {
    const dbDir = path.join(db.path_databases, req.body.id)
    try {
      await rmrf(dbDir)
      res.status(201).send('successfully deleted')
    } catch (err) {
      res.status(400).send(err)
    }
  };

  const getDirectorySize = async (directory) => {
    if (!fs.existsSync(directory)) return 0

    const entries = await readdir(directory, {withFileTypes: true})
    const sizes = await Promise.all(entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return getDirectorySize(entryPath)
      if (entry.isFile()) {
        const {size} = await stat(entryPath)
        return size
      }
      return 0
    }))

    return sizes.reduce((sum, size) => sum + size, 0)
  }

  const getDatabaseSizes = async function (req, res) {
    const ids = req.body?.ids
    if (!Array.isArray(ids) || !ids.length) {
      res.status(400).send({message: 'ids array is required'})
      return
    }

    try {
      const sizes = {}
      await Promise.all(ids.map(async (id) => {
        const dbDir = path.join(db.path_databases, id)
        sizes[id] = await getDirectorySize(dbDir)
      }))
      res.status(201).send({sizes})
    } catch (err) {
      res.status(400).send({message: err.message || String(err)})
    }
  };

  const getFolderSize = async function (req, res) {
    const dirPath = resolveGeneratedFolderPath(dbPath, req.body.folder)
    if (!dirPath) {
      res.status(400).send({message: 'Unknown folder type'})
      return
    }

    const dirSize = async (directory) => {
      if (!fs.existsSync(directory)) return 0

      const files = await readdir(directory)
      const stats = files.map(file => stat(path.join(directory, file)))

      return (await Promise.all(stats)).reduce((accumulator, {size}) => accumulator + size, 0)
    }

    const size = await dirSize(dirPath)
    res.status(201).send({size})
  };

  const clearData = async function (req, res) {
    const imageType = req.body.imageType
    const delPath = resolveGeneratedFolderPath(dbPath, imageType)

    if (!delPath) {
      res.status(400).send({message: 'Unknown folder type'})
      return
    }

    try {
      await rmrf(delPath)
      if (!fs.existsSync(delPath)) fs.mkdirSync(delPath, {recursive: true})
      res.sendStatus(201)
    } catch (err) {
      res.status(400).send(err)
    }
  };

  const searchMediaByPath = function (req, res) {
    db.Media
      .findAll({
        where: {
          path: {
            [Op.like]: `%${req.body.query}%`
          },
        },
      })
      .then(data => {
        res.status(201).send(data)
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };
  const updateMediaMultiple = async function (req, res) {
    const mediaFiles = req.body.mediaFiles;
    // loop over the inputs and return an array of promises, one for each update
    const promises = mediaFiles.map(i => {
      return db.Media.update(i, {where: {id: i.id}});
    });
    // resolve all the db calls at once
    await Promise.all(promises);
    res.sendStatus(201);
  };

  const getConfig = async (req, res) => {
    try {
      const configPath = getAppConfigPath()
      const config_json = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      res.status(200).json(config_json)
    } catch (error) {
      res.status(500).json({message: error.message || 'Failed to read config'})
    }
  };

  const getMostPopularWordsFromMedia = async (req, res) => {
    try {
      const settings = await getParserSettings()
      const data = await db.Media.findAll({raw: true})

      const parsed = data.map(i => {
        const tokenized = tokenizeFilePath(i.path, {
          folderWeight: settings.folderWeight,
        })
        return {
          folders: tokenized.tokens
            .filter(token => token.source === 'folder')
            .map(token => token.token),
          file: tokenized.tokens
            .filter(token => token.source === 'file')
            .map(token => token.token)
            .join(' '),
          tokens: tokenized.tokens,
        }
      })

      res.status(201).send(parsed)
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    }
  };

  const suggestTagsFromPaths = async (req, res) => {
    try {
      const settings = await getParserSettings({
        useML: req.query.useML ?? req.body?.settings?.useML,
      })
      const requestPaths = Array.isArray(req.body?.paths) ? req.body.paths : []
      const media = requestPaths.length > 0
        ? requestPaths.map(item => ({
          path: typeof item === 'string' ? item : item.path,
        })).filter(item => item.path)
        : await db.Media.findAll({raw: true})
      const suggestions = await suggestTagsFromMedia(db, media, {
        ...settings,
        limit: req.query.limit ?? req.body?.limit,
        maxWords: req.body?.maxWords || 3,
        excludeExisting: req.body?.excludeExisting,
      })

      res.status(201).send({
        words: suggestions.map(i => [i.word, Math.round(i.occurrences)]),
        suggestions,
      })
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while suggesting tags."
      })
    }
  }

  const suggestTagsFromVideoFrames = async (req, res) => {
    try {
      const requestPaths = Array.isArray(req.body?.paths) ? req.body.paths : []
      const mediaTypeId = Number(req.body?.mediaTypeId || 1)
      const mediaLimit = Math.max(1, Math.min(Number(req.body?.mediaLimit || 20), 100))
      const locale = req.body?.locale || 'en'

      const media = requestPaths.length > 0
        ? await db.Media.findAll({
          where: {
            path: {
              [Op.in]: requestPaths.map(item => typeof item === 'string' ? item : item.path).filter(Boolean),
            },
            mediaTypeId,
          },
          raw: true,
        })
        : await db.Media.findAll({
          where: {mediaTypeId},
          limit: mediaLimit,
          order: [['createdAt', 'DESC']],
          raw: true,
        })

      const result = await getVideoClipTagger().suggestTagsFromVideoFrames(db, media, {
        locale,
        framesPerVideo: req.body?.framesPerVideo || 4,
        frameWidth: req.body?.frameWidth || 384,
        topK: req.body?.topK || 8,
        minScore: req.body?.minScore || 0.03,
        limit: req.body?.limit || 50,
        excludeExisting: req.body?.excludeExisting,
      })

      res.status(201).send({
        words: result.suggestions.map(i => [i.word, i.occurrences]),
        suggestions: result.suggestions,
        frames: result.frames,
        media: result.media,
        model: result.model,
      })
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while suggesting tags from video frames."
      })
    }
  }

  const streamVideoObjectRecognition = async (req, res) => {
    const writeEvent = (event) => {
      res.write(`${JSON.stringify(event)}\n`)
    }

    try {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('X-Accel-Buffering', 'no')

      const requestPaths = Array.isArray(req.body?.paths) ? req.body.paths : []
      const mediaTypeId = Number(req.body?.mediaTypeId || 1)
      const locale = req.body?.locale || 'en'
      const pathValues = requestPaths
        .map(item => typeof item === 'string' ? item : item.path)
        .filter(Boolean)

      const media = pathValues.length > 0
        ? await db.Media.findAll({
          where: {
            path: {[Op.in]: pathValues},
            mediaTypeId,
          },
          raw: true,
        })
        : []

      const total = media.length
      let processed = 0
      let frames = 0
      let suggestions = []
      const existingTags = req.body?.excludeExisting === false
        ? []
        : await db.Tag.findAll({raw: true})

      writeEvent({
        type: 'progress',
        processed,
        total,
        remaining: total,
      })

      for (const item of media) {
        const result = await getVideoClipTagger().classifyMedia(db, item, {
          locale,
          framesPerVideo: req.body?.framesPerVideo || 4,
          frameWidth: req.body?.frameWidth || 384,
          topK: req.body?.topK || 8,
          minScore: req.body?.minScore || 0.03,
          limit: req.body?.limit || 50,
          excludeExisting: req.body?.excludeExisting,
          tags: existingTags,
        })

        frames += result.frames
        suggestions = getVideoClipTagger().aggregateFrameResults([
          ...suggestions.flatMap(item => item.samples.map(sample => ({
            key: item.key,
            score: sample.score || item.confidence,
            mediaId: sample.mediaId,
            timestamp: sample.timestamp,
          }))),
          ...result.suggestions.flatMap(item => item.samples.map(sample => ({
            key: item.key,
            score: sample.score || item.confidence,
            mediaId: sample.mediaId,
            timestamp: sample.timestamp,
          }))),
        ], locale, existingTags).slice(0, Number(req.body?.limit || 50))

        processed += 1
        writeEvent({
          type: 'progress',
          processed,
          total,
          remaining: Math.max(total - processed, 0),
          current: item.path,
        })
      }

      writeEvent({
        type: 'complete',
        words: suggestions.map(i => [i.word, i.occurrences]),
        suggestions,
        frames,
        media: total,
        model: getVideoClipTagger().CLIP_MODEL,
      })
      res.end()
    } catch (err) {
      writeEvent({
        type: 'error',
        message: err.message || "Some error occurred while recognizing video objects."
      })
      res.end()
    }
  }

  const parsePathTags = async (req, res) => {
    try {
      const paths = Array.isArray(req.body.paths) ? req.body.paths : []
      const settings = await getParserSettings(req.body.settings || {})
      const [tags, metas] = await Promise.all([
        db.Tag.findAll({raw: true}),
        db.Meta.findAll({raw: true}),
      ])

      let values = []
      for (const item of paths) {
        if (!item?.path || !item?.mediaId) continue
        const parsed = await matchPathToTags(db, item.path, item.mediaId, tags, metas, {
          ...settings,
          metaIds: req.body.metaIds,
        })
        values.push(...parsed)
      }

      res.status(201).send(values.map(i => ({
        tagId: i.tagId,
        metaId: i.metaId,
        mediaId: i.mediaId,
      })))
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while parsing tags."
      })
    }
  }

  const parserStatus = async (req, res) => {
    try {
      const settings = await getParserSettings()
      res.status(201).send(getEmbeddingModel().getStatus(db, settings.useML))
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while checking parser status."
      })
    }
  }

  const downloadParserModel = async (req, res) => {
    try {
      await getEmbeddingModel().loadModel(db)
      res.status(201).send(getEmbeddingModel().getStatus(db, true))
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while downloading parser model."
      })
    }
  }

  const clipModelStatus = async (req, res) => {
    try {
      res.status(201).send(getVideoClipTagger().getStatus(db))
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while checking CLIP model status."
      })
    }
  }

  const downloadClipModel = async (req, res) => {
    try {
      await getVideoClipTagger().loadModel(db)
      res.status(201).send(getVideoClipTagger().getStatus(db))
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while downloading CLIP model."
      })
    }
  }

  const contentHashBackfillStatus = async (req, res) => {
    try {
      const status = await getContentHashBackfillStatus(db)
      res.status(201).send(status)
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while checking content hash status."
      })
    }
  }

  const videoImagesGenerationStatus = async (req, res) => {
    try {
      const status = await getVideoImagesGeneration().getVideoImagesGenerationStatus(db, dbPath)
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

      for await (const event of getVideoImagesGeneration().iterateVideoImagesGeneration(db, dbPath, imageType, {
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

  const imageThumbsGenerationStatus = async (req, res) => {
    try {
      const status = await getImageThumbsGeneration().getImageThumbsGenerationStatus(db, dbPath)
      res.status(201).send(status)
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while checking image thumbnails generation status.',
      })
    }
  }

  const streamImageThumbsGeneration = async (req, res) => {
    const writeEvent = (event) => {
      res.write(`${JSON.stringify(event)}\n`)
    }

    try {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('X-Accel-Buffering', 'no')

      const shouldStop = createStreamAbortSignal(req, res)

      for await (const event of getImageThumbsGeneration().iterateImageThumbsGeneration(
        db,
        dbPath,
        getImageMedia(),
        {
          shouldStop,
          force: String(req.query.force || '').toLowerCase() === 'true',
        },
      )) {
        writeEvent(event)
      }

      res.end()
    } catch (err) {
      writeEvent({
        type: 'error',
        message: err.message || 'Some error occurred while generating image thumbnails.',
      })
      res.end()
    }
  }

  const streamContentHashBackfill = async (req, res) => {
    const writeEvent = (event) => {
      res.write(`${JSON.stringify(event)}\n`)
    }

    try {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('X-Accel-Buffering', 'no')

      const shouldStop = createStreamAbortSignal(req, res)

      for await (const event of iterateContentHashBackfill(db, {
        shouldStop,
        force: String(req.query.force || '').toLowerCase() === 'true',
      })) {
        writeEvent(event)
      }

      res.end()
    } catch (err) {
      writeEvent({
        type: 'error',
        message: err.message || "Some error occurred while backfilling content hashes."
      })
      res.end()
    }
  }

  const missingMediaStatus = async (req, res) => {
    try {
      const status = await getMissingMediaStatus(db)
      res.status(201).send(status)
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while checking missing media status."
      })
    }
  }

  const streamFindMissingMedia = async (req, res) => {
    const writeEvent = (event) => {
      res.write(`${JSON.stringify(event)}\n`)
    }

    try {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('X-Accel-Buffering', 'no')

      const folders = Array.isArray(req.body?.folders) ? req.body.folders : []
      const shouldStop = createStreamAbortSignal(req, res)

      for await (const event of iterateMissingMediaSearch(db, {
        folders,
        shouldStop,
      })) {
        writeEvent(event)
      }

      res.end()
    } catch (err) {
      writeEvent({
        type: 'error',
        message: err.message || "Some error occurred while searching for missing media."
      })
      res.end()
    }
  }

  const relinkMissingMedia = async (req, res) => {
    try {
      const matches = Array.isArray(req.body?.matches) ? req.body.matches : []
      let updated = 0

      for (const item of matches) {
        const filePath = item.newPath || item.path
        const mediaId = item.id

        if (!filePath || !mediaId) continue

        const data = {
          path: filePath,
          basename: path.basename(filePath),
          name: path.parse(filePath).name,
          ext: path.extname(filePath),
        }

        if (item.contentHash) {
          data.contentHash = item.contentHash
        }

        await db.Media.update(data, {
          where: {id: mediaId},
          silent: true,
        })

        updated += 1
      }

      res.status(201).send({updated})
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while relinking missing media."
      })
    }
  }

  return {
    importSavedFilters,
    checkFileExists,
    renameFile,
    openPath,
    getFileList,
    addMediaVideo,
    addMediaImage,
    addMediaAudio,
    addMediaText,
    addMedia,
    createThumbForVideo,
    createThumb,
    createGrid,
    createTimeline,
    getMachineId,
    createImage,
    deleteFile,
    deleteDb,
    getDatabaseSizes,
    getFolderSize,
    clearData,
    searchMediaByPath,
    updateMediaMultiple,
    updateMediaInfo,
    getConfig,
    getMostPopularWordsFromMedia,
    suggestTagsFromPaths,
    suggestTagsFromVideoFrames,
    streamVideoObjectRecognition,
    parsePathTags,
    parserStatus,
    downloadParserModel,
    clipModelStatus,
    downloadClipModel,
    contentHashBackfillStatus,
    streamContentHashBackfill,
    videoImagesGenerationStatus,
    streamVideoImagesGeneration,
    imageThumbsGenerationStatus,
    streamImageThumbsGeneration,
    missingMediaStatus,
    streamFindMissingMedia,
    relinkMissingMedia,
  }
}