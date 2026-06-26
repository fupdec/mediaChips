const {matchPathToTags} = require('../../services/pathTagMatcher')
const {suggestTagsFromMedia} = require('../../services/tagSuggester')

module.exports = function createTasksTaggingController(shared) {
  const {
    db,
    Op,
    getParserSettings,
    getVideoClipTagger,
    getEmbeddingModel,
  } = shared

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

  return {
    suggestTagsFromPaths,
    suggestTagsFromVideoFrames,
    streamVideoObjectRecognition,
    parsePathTags,
    parserStatus,
    downloadParserModel,
    clipModelStatus,
    downloadClipModel,
  }
}
