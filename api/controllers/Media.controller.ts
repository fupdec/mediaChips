import type { ApiDb, AnyRecord } from '../types/db'
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

module.exports = function (db: ApiDb) {
  const dbPath = db.path

  // Retrieve all Media from the database.
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
      const thumbs: AnyRecord = {}
      const basePath = path.join(dbPath, 'media', mediaType)

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
      const [[row]] = await db.sequelize.query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(filesize), 0) AS filesize
        FROM media
      `)

      res.status(200).send({
        total: Number(row?.total || 0),
        filesize: Number(row?.filesize || 0),
      })
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while performing query.',
      })
    }
  }

  // get one Media by ID.
  const getOneById = function (req: ApiRequest, res: ApiResponse) {
    db.Media.findOne({
      where: {
        id: req.params.id,
      },
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Find a single Media with an id
  const numberOfMediaWithTag = function (req: ApiRequest, res: ApiResponse) {
    db.Media.count({
      where: {
        mediaTypeId: req.query.mediaTypeId,
      },
      include: [{
        model: db.TagsInMedia,
        where: {
          tagId: req.query.tagId
        },
        required: true
      }]
    }).then((number: number) => {
      res.status(201).send({
        count: number
      })
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  // update file path, name, basename and ext by path
  const updatePath = function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<MediaPathUpdatePayload>(req)
    const data = {
      path: body.path,
      basename: path.basename(String(body.path ?? '')),
      name: path.parse(String(body.path ?? '')).name,
      ext: path.extname(String(body.path ?? '')),
    }

    db.Media.update(data, {
      where: {
        id: body.id,
      },
      silent: true,
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a Media by the id in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<EntityUpdatePayload>(req)
    const silent = body.silent
    db.Media.update(body, {
      where: {
        id: req.params.id,
      },
      silent: silent,
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Delete a media with the specified id in the request
  const deleteOne = async function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<DeleteEntityOnePayload>(req)
    const id = body.id

    try {
      const media = await db.Media.findOne({
        where: {id},
        include: [{
          model: db.MediaType,
          attributes: ['id', 'type'],
        }],
      })

      if (!media) {
        return res.status(404).send({
          message: 'Media not found.',
        })
      }

      const mediaType = media.MediaType || await db.MediaType.findOne({
        where: {id: media.mediaTypeId},
        raw: true,
      })

      await deleteMediaGeneratedAssets(db, dbPath, media, mediaType)

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

      await db.Media.destroy({where: {id}})
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