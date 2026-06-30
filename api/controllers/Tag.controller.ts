import type { ApiDb, FilterLike } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import type { DeleteEntityOnePayload, EntityUpdatePayload } from '@shared/api/responses'
import type { CreateTagPayload, TagItemsListRequest } from '@shared/api/payloads'
import { getRequestBody } from '../types/http'
import { createTagsRepository, type TagInsert } from '../db/repositories/tags'
import { createMarksRepository } from '../db/repositories/marks'
import {
  deleteMarkGeneratedAsset,
  deleteTagGeneratedAssets,
} from '../services/localAssetCleanup'
import { loadTagItems } from '../services/tagItemsLoader'

export default function (db: ApiDb) {
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
      const limit = Number(body.limit)
      const page = Number(body.page) || 1
      const result = loadTagItems(db, {
        metaId,
        ids,
        filters: (body.filters ?? []) as unknown as FilterLike[],
        sortBy: body.sortBy ?? 'id',
        direction: body.direction ?? 'desc',
        find_duplicates: body.find_duplicates ?? false,
        page,
        limit: limit > 0 ? limit : null,
        skipTotals: body.skipTotals === true,
      })
      res.status(201).send(result)
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
      const { silent, ...updates } = body
      tagsRepo.updateById(Number(req.params.id), updates as Partial<TagInsert>, {silent: Boolean(silent)})
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
