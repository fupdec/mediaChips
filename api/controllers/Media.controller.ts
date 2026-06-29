import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import { getRequestBody } from '../types/http'
import type { ItemsListRequest, DeleteEntityOnePayload, EntityUpdatePayload } from '@shared/api/responses'
import type { MediaPathUpdatePayload, MediaThumbsRequestPayload } from '@shared/api/payloads'
const fs = require('fs')
const path = require('path')
const {
  deleteMediaGeneratedAssets,
  unlinkResolvedPath,
} = require('../services/localAssetCleanup')
const {
  loadMediaItems,
  loadFilteredMediaIds,
  loadMediaBasicsByIds,
} = require('../services/mediaItemsLoader')
const {createMediaRepository} = require('../db/repositories/media')
const {createMediaTypesRepository} = require('../db/repositories/mediaTypes')

module.exports = function (db: ApiDb) {
  const mediaRepo = createMediaRepository(db.drizzle)
  const mediaTypesRepo = createMediaTypesRepository(db.drizzle)
  const getDbPath = () => db.path!

  const getAll = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const body = getRequestBody<ItemsListRequest>(req)
      const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []
      const limit = Number(body.limit)
      const page = Number(body.page) || 1

      const result = await loadMediaItems(db, {
        mediaTypeId: body.mediaTypeId,
        ids,
        filters: body.filters,
        sortBy: body.sortBy,
        direction: body.direction,
        find_duplicates: body.find_duplicates,
        duplicates_by: body.duplicates_by || 'filesize',
        page,
        limit: limit > 0 ? limit : null,
        includeNavigation: body.includeNavigation === true && !ids.length,
        skipTotals: body.skipTotals === true,
      })

      res.status(201).send(result)
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  const getFilteredIds = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const body = getRequestBody<ItemsListRequest>(req)
      const result = await loadFilteredMediaIds(db, {
        mediaTypeId: body.mediaTypeId,
        filters: body.filters,
        sortBy: body.sortBy,
        direction: body.direction,
        find_duplicates: body.find_duplicates,
        duplicates_by: body.duplicates_by || 'filesize',
      })

      res.status(201).send(result)
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while retrieving media ids.',
      })
    }
  }

  const getBasicsByIds = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(Boolean) : []
      const items = await loadMediaBasicsByIds(db, ids)
      res.status(201).send({items})
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while retrieving media.',
      })
    }
  }

  const getThumbs = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const body = getRequestBody<MediaThumbsRequestPayload>(req)
      const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []
      const mediaType = String(body.mediaType || 'videos')
      const thumbs: Record<string, string> = {}
      const basePath = path.join(getDbPath(), 'media', mediaType)

      for (const id of ids) {
        for (const folder of ['grids', 'thumbs']) {
          const filePath = path.join(basePath, folder, `${id}.jpg`)
          if (!fs.existsSync(filePath)) continue

          const buffer = fs.readFileSync(filePath)
          thumbs[id] = `data:image/jpeg;base64,${buffer.toString('base64')}`
          break
        }
      }

      res.status(201).send({thumbs})
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while retrieving thumbnails.',
      })
    }
  }

  const getStats = async function (req: ApiRequest, res: ApiResponse) {
    try {
      res.status(200).send(mediaRepo.getStats(db))
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while performing query.',
      })
    }
  }

  const getOneById = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = mediaRepo.findById(Number(req.params.id)) ?? null
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  const numberOfMediaWithTag = function (req: ApiRequest, res: ApiResponse) {
    try {
      const count = mediaRepo.countWithTag(req.query.mediaTypeId, req.query.tagId)
      res.status(201).send({count})
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  const updatePath = function (req: ApiRequest, res: ApiResponse) {
    try {
      const body = getRequestBody<MediaPathUpdatePayload>(req)
      const data = {
        path: body.path,
        basename: path.basename(String(body.path ?? '')),
        name: path.parse(String(body.path ?? '')).name,
        ext: path.extname(String(body.path ?? '')),
      }

      mediaRepo.updateById(Number(body.id), data, {silent: true})
      res.status(201).send([1])
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  const update = function (req: ApiRequest, res: ApiResponse) {
    try {
      const body = getRequestBody<EntityUpdatePayload>(req)
      mediaRepo.updateById(Number(req.params.id), body, {silent: Boolean(body.silent)})
      res.status(201).send([1])
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  const deleteOne = async function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<DeleteEntityOnePayload>(req)
    const id = body.id

    try {
      const media = mediaRepo.findById(Number(id))

      if (!media) {
        return res.status(404).send({
          message: 'Media not found.',
        })
      }

      const mediaType = media.mediaTypeId
        ? mediaTypesRepo.findById(media.mediaTypeId)
        : undefined

      await deleteMediaGeneratedAssets(db, getDbPath(), media, mediaType?.type || '')

      if (body.with_file) {
        const filePath = media.path || body.path

        try {
          const deleted = await unlinkResolvedPath(filePath)
          if (!deleted) {
            console.log(`${filePath} is unavailable.`)
          }
        } catch (error) {
          console.error(`Failed to delete media file ${filePath}:`, apiErrorMessage(error))
        }
      }

      mediaRepo.deleteById(Number(id))
      res.sendStatus(201)
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while performing query.',
      })
    }
  };

  return {
    numberOfMediaWithTag,
    updatePath,
    update,
    deleteOne,
    getOneById,
    getAll,
    getFilteredIds,
    getBasicsByIds,
    getThumbs,
    getStats,
  }
}
