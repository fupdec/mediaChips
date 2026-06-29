import type { TaskControllerShared, TagSuggestionItem } from '../../types/tasks'
import type { AnyRecord } from '../../types/db'
import { apiErrorMessage } from '../../types/errors'
import type { ApiRequest, ApiResponse } from '../../types/http'
import type { ParsePathTagEntry } from '@shared/api/responses'
const {matchPathToTags} = require('../../services/pathTagMatcher')
const {suggestTagsFromMedia} = require('../../services/tagSuggester')

module.exports = function createTasksTaggingController(shared: TaskControllerShared) {
  const {
    db,
    Op,
    getParserSettings,
    getVideoClipTagger,
    getEmbeddingModel,
  } = shared

  const suggestTagsFromPaths = async (req: ApiRequest, res: ApiResponse) => {
    try {
      const settings = await getParserSettings({
        useML: req.query.useML ?? req.body?.settings?.useML,
      })
      const requestPaths = Array.isArray(req.body?.paths) ? req.body.paths : []
      const media = requestPaths.length > 0
        ? requestPaths.map((item: AnyRecord) => ({
          path: typeof item === 'string' ? item : item.path,
        })).filter((item: AnyRecord) => item.path)
        : await db.Media.findAll({raw: true})
      const suggestions = await suggestTagsFromMedia(db, media, {
        ...settings,
        limit: req.query.limit ?? req.body?.limit,
        maxWords: req.body?.maxWords || 3,
        excludeExisting: req.body?.excludeExisting,
      })

      res.status(201).send({
        words: suggestions.map((i: TagSuggestionItem) => [i.word, Math.round(Number(i.occurrences || 0))]),
        suggestions,
      })
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while suggesting tags."
      })
    }
  }

  const suggestTagsFromVideoFrames = async (req: ApiRequest, res: ApiResponse) => {
    try {
      const requestPaths = Array.isArray(req.body?.paths) ? req.body.paths : []
      const mediaTypeId = Number(req.body?.mediaTypeId || 1)
      const mediaLimit = Math.max(1, Math.min(Number(req.body?.mediaLimit || 20), 100))
      const locale = req.body?.locale || 'en'

      const media = requestPaths.length > 0
        ? await db.Media.findAll({
          where: {
            path: {
              [Op.in]: requestPaths.map((item: AnyRecord) => typeof item === 'string' ? item : item.path).filter(Boolean),
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
        words: result.suggestions.map((i: TagSuggestionItem) => [i.word, i.occurrences]),
        suggestions: result.suggestions,
        frames: result.frames,
        media: result.media,
        model: result.model,
      })
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while suggesting tags from video frames."
      })
    }
  }

  const streamVideoObjectRecognition = async (req: ApiRequest, res: ApiResponse) => {
    const writeEvent = (event: Record<string, unknown>) => {
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
        .map((item: AnyRecord) => typeof item === 'string' ? item : item.path)
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
      let suggestions: TagSuggestionItem[] = []
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
          ...suggestions.flatMap((item: TagSuggestionItem) => (item.samples || []).map((sample) => ({
            key: item.key,
            score: sample.score || item.confidence,
            mediaId: sample.mediaId,
            timestamp: sample.timestamp,
          }))),
          ...result.suggestions.flatMap((item: TagSuggestionItem) => (item.samples || []).map((sample) => ({
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
        words: suggestions.map((i: TagSuggestionItem) => [i.word, i.occurrences]),
        suggestions,
        frames,
        media: total,
        model: getVideoClipTagger().CLIP_MODEL,
      })
      res.end()
    } catch (err) {
      writeEvent({
        type: 'error',
        message: apiErrorMessage(err) || "Some error occurred while recognizing video objects."
      })
      res.end()
    }
  }

  const parsePathTags = async (req: ApiRequest, res: ApiResponse) => {
    try {
      const paths = Array.isArray(req.body.paths) ? req.body.paths : []
      const settings = await getParserSettings(req.body.settings || {})
      const [tags, metas] = await Promise.all([
        db.Tag.findAll({raw: true}),
        db.Meta.findAll({raw: true}),
      ])

      let values: AnyRecord[] = []
      for (const item of paths) {
        if (!item?.path || !item?.mediaId) continue
        const parsed = await matchPathToTags(db, item.path, item.mediaId, tags, metas, {
          ...settings,
          metaIds: req.body.metaIds,
        })
        values.push(...parsed)
      }

      res.status(201).send(values.map((i: AnyRecord) => ({
        tagId: i.tagId,
        metaId: i.metaId,
        mediaId: i.mediaId,
      })) as ParsePathTagEntry[])
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while parsing tags."
      })
    }
  }

  const parserStatus = async (req: ApiRequest, res: ApiResponse) => {
    try {
      const settings = await getParserSettings()
      res.status(201).send(getEmbeddingModel().getStatus(db, settings.useML))
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while checking parser status."
      })
    }
  }

  const downloadParserModel = async (req: ApiRequest, res: ApiResponse) => {
    try {
      await getEmbeddingModel().loadModel(db)
      res.status(201).send(getEmbeddingModel().getStatus(db, true))
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while downloading parser model."
      })
    }
  }

  const clipModelStatus = async (req: ApiRequest, res: ApiResponse) => {
    try {
      res.status(201).send(getVideoClipTagger().getStatus(db))
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while checking CLIP model status."
      })
    }
  }

  const downloadClipModel = async (req: ApiRequest, res: ApiResponse) => {
    try {
      await getVideoClipTagger().loadModel(db)
      res.status(201).send(getVideoClipTagger().getStatus(db))
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while downloading CLIP model."
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
