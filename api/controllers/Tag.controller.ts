import type { ApiDb, AnyRecord } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import { getRequestBody } from '../types/http'
import type { DeleteEntityOnePayload, EntityUpdatePayload } from '@shared/api/responses'
import type { CreateTagPayload, TagItemsListRequest } from '@shared/api/payloads'
const {parseItemsFromDb, filterItems} = require('../../app/tasks/items.js')
const {
  deleteMarkGeneratedAsset,
  deleteTagGeneratedAssets,
} = require('../services/localAssetCleanup')

module.exports = function (db: ApiDb) {
  const dbPath = db.path

  // Retrieve all Tags from the database.
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

    const replacements: AnyRecord = {metaId}
    let query = `SELECT tags.*, tags_in_tags.tag_tags, values_in_tags.tag_values
                 FROM tags
                          LEFT JOIN (SELECT tagsInTags.parentTagId                                     id,
                                            GROUP_CONCAT(tagsInTags.tagId || '^' || tagsInTags.metaId) tag_tags
                                     FROM tagsInTags
                                     GROUP BY id) AS tags_in_tags ON tags.id = tags_in_tags.id
                          LEFT JOIN (SELECT valuesInTags.tagId                                             id,
                                            GROUP_CONCAT(valuesInTags.value || '^' || valuesInTags.metaId) tag_values
                                     FROM valuesInTags
                                     GROUP BY id) AS values_in_tags ON tags.id = values_in_tags.id
                 WHERE tags.metaId = :metaId`

    if (ids.length) {
      replacements.ids = ids
      query += ' AND tags.id IN (:ids)'
    }

    try {
      const data = await db.sequelize.query(query, {replacements})
      const items_all = parseItemsFromDb(data[0])
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

  // Create and Save a new Tag
  const create = function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<CreateTagPayload[]>(req)
    db.Tag.bulkCreate(body).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  // Find a single Tag with an id
  const findOne = function (req: ApiRequest, res: ApiResponse) {
    db.Tag.findOne({
      where: {
        id: req.params.id
      }
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  const getCount = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const count = await db.Tag.count()
      res.status(200).send({count})
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while performing query.',
      })
    }
  }

  // Retrieve all Tag from the database.
  const getAll = function (req: ApiRequest, res: ApiResponse) {
    db.Tag.findAll({
      raw: true
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a Tag by the id in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<EntityUpdatePayload>(req)
    const silent = body.silent
    db.Tag.update(body, {
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

  // delete an Tag by the id
  const deleteOne = async function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<DeleteEntityOnePayload>(req)
    const id = body.id

    try {
      const tag = await db.Tag.findOne({
        where: {id},
        raw: true,
      })

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

      const marks = await db.Mark.findAll({
        where: {tagId: id},
        attributes: ['id'],
        raw: true,
      })

      for (const mark of marks) {
        deleteMarkGeneratedAsset(dbPath, mark.id)
      }

      await deleteTagGeneratedAssets(dbPath, metaId, id)

      await db.Tag.destroy({where: {id}})
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