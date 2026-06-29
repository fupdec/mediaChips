import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import type { DeleteEntityOnePayload, EntityUpdatePayload } from '@shared/api/responses'
import type { CreateTagPayload, TagItemsListRequest } from '@shared/api/payloads'
import { getRequestBody } from '../types/http'
const {parseItemsFromDb, filterItems} = require('../../app/tasks/items.js')
const {
  deleteMarkGeneratedAsset,
  deleteTagGeneratedAssets,
} = require('../services/localAssetCleanup')
const {createTagsRepository} = require('../db/repositories/tags')
const {createMarksRepository} = require('../db/repositories/marks')

module.exports = function (db: ApiDb) {
  const tagsRepo = createTagsRepository(db.drizzle, db.sqlite)
  const marksRepo = createMarksRepository(db.drizzle)
  const getDbPath = () => db.path!

  const getAllForItems = async function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<TagItemsListRequest>(req)
    const metaId = Number(body.metaId)
    if (!Number.isFinite(metaId)) {
      return res.status(400).send({
        message: 'metaId is required',
      })
    }

    const ids = Array.isArray(body.ids)
      ? body.ids.map((id: unknown) => Number(id)).filter((id: unknown) => Number.isFinite(id))
      : []

    try {
      const data = tagsRepo.getItemsForMeta(metaId, ids)
      const items_all = parseItemsFromDb(data)
      const items_filtered = filterItems(
        body.filters,
        'tags',
        items_all,
        body.sortBy,
        body.direction,
        body.find_duplicates,
      )
      res.status(201).send({items: items_filtered, total: items_all.length})
    } catch (err) {
      console.log(err)

      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  const create = function (req: ApiRequest, res: ApiResponse) {
    try {
      const body = getRequestBody<CreateTagPayload[]>(req)
      const data = tagsRepo.bulkCreate(body)
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  const findOne = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = tagsRepo.findById(Number(req.params.id)) ?? null
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  const getCount = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const count = tagsRepo.countAll()
      res.status(200).send({count})
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while performing query.',
      })
    }
  }

  const getAll = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = tagsRepo.findAllRaw()
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  const update = function (req: ApiRequest, res: ApiResponse) {
    try {
      const body = getRequestBody<EntityUpdatePayload>(req)
      const silent = body.silent
      tagsRepo.updateById(Number(req.params.id), body, {silent: Boolean(silent)})
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
      const tag = tagsRepo.findById(Number(id))

      if (!tag) {
        return res.status(404).send({
          message: 'Tag not found.',
        })
      }

      const metaId = req.body.metaId || tag.metaId
      if (!metaId) {
        return res.status(400).send({
          message: 'metaId is required to delete tag assets.',
        })
      }

      const marks = marksRepo.findIdsByTagId(id)

      for (const mark of marks) {
        deleteMarkGeneratedAsset(getDbPath(), mark.id)
      }

      await deleteTagGeneratedAssets(getDbPath(), metaId, id)

      tagsRepo.deleteById(Number(id))
      res.sendStatus(201)
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while performing query.',
      })
    }
  };

  return {
    create,
    getCount,
    getAllForItems,
    getAll,
    findOne,
    update,
    deleteOne,
  }
}
