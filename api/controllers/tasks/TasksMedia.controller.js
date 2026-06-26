const fs = require('fs')
const path = require('path')
const {stat} = require('fs/promises')
const {ffprobe} = require('../../utils/ffmpeg')
const {tokenizeFilePath} = require('../../services/pathTokenizer')
const {
  computeContentHashForPath,
  fileExists,
  verifyContentHashMatch,
  resolveExistingPath,
} = require('../../services/contentHash')
const {
  normalizeMediaPath,
  pathsEquivalent,
  buildPathLookupVariants,
} = require('../../utils/normalizeUserPath')

module.exports = function createTasksMediaController(shared) {
  const {
    db,
    dbPath,
    Op,
    Sequelize,
    withTimeout,
    getParserSettings,
    getImageMedia,
    createThumbMiddle,
  } = shared

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

  const {createMediaPostProcessor} = require('../../services/mediaPostProcess')
  const mediaPostProcess = createMediaPostProcessor({
    db,
    dbPath,
    getVideoMetadata,
    getAudioMetadata,
    getImageMedia,
    createThumbMiddle,
    withTimeout,
  })

  const sendAddMediaResponse = (res, {media, isCreated, duplicate}) => {
    if (isCreated) {
      res.status(201).send(media)
      return
    }

    res.status(202).send({
      message: 'Media already added.',
      duplicate,
    })
  }

  const addMedia = async function (req, res) {
    try {
      const pathToFile = req.body.path
      const mediaType = req.body.type
      const is_check_duplicates = req.body.is_check_duplicates

      const result = await addMediaToDb(pathToFile, mediaType, is_check_duplicates)

      if (result.isCreated) {
        await mediaPostProcess.processNewMedia(result.media, mediaType)
      }

      sendAddMediaResponse(res, result)
    } catch (error) {
      console.error('addMedia failed:', error)
      res.status(400).send({
        message: error.message || String(error),
      })
    }
  }

  const addMediaVideo = addMedia
  const addMediaImage = addMedia
  const addMediaAudio = addMedia
  const addMediaText = addMedia

  const updateMediaInfo = async (req, res) => {
    const media_id = req.body.id

    try {
      const media = await db.Media.findOne({where: {id: media_id}})

      if (media) {
        const mediaType = await db.MediaType.findOne({
          where: {id: media.mediaTypeId},
          raw: true,
        })

        await mediaPostProcess.refreshMediaInfo(media, mediaType)

        const stats = fs.statSync(media.dataValues.path)
        const filesize = stats.size

        await db.Media.update({
          filesize,
        }, {
          where: {id: media_id},
        })
      }

      res.status(201).send('success')
    } catch (error) {
      res.status(202).send(error)
    }
  }

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
  }

  const updateMediaMultiple = async function (req, res) {
    const mediaFiles = req.body.mediaFiles;
    const promises = mediaFiles.map(i => {
      return db.Media.update(i, {where: {id: i.id}});
    });
    await Promise.all(promises);
    res.sendStatus(201);
  }

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
  }

  return {
    addMediaVideo,
    addMediaImage,
    addMediaAudio,
    addMediaText,
    addMedia,
    updateMediaInfo,
    searchMediaByPath,
    updateMediaMultiple,
    getMostPopularWordsFromMedia,
  }
}
