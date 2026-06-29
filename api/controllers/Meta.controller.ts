import type { ApiDb, AnyRecord } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import { getRequestBody } from '../types/http'
import type { Meta, MetaWritePayload } from '@shared/entities/meta'
import { paramString } from '../types/errors'
const fs = require("fs")
const path = require('path')

module.exports = function (db: ApiDb) {
  const metaFolder = path.join(db.path, 'meta')
  // Create and Save a new Meta
  const create = function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<MetaWritePayload>(req)
    db.Meta.create(body, {
        include: [db.PageSetting],
        raw: true
      })
      .then(async (data) => {
        const m = data.dataValues as AnyRecord | undefined
        if (!m) {
          res.status(201).send(data)
          return
        }
        if (m.type == 'array') {
          const dir = path.join(metaFolder, String(m.id))
          if (!fs.existsSync(dir)) fs.mkdirSync(dir);

          const [cf, isC] = await db.SavedFilter.findOrCreate({
            where: {
              name: null,
              metaId: m.id
            }
          })

          if (isC) {
            await db.PageSetting.update({
              filterId: cf.id
            }, {
              where: {
                metaId: m.id
              }
            })
          }
        }

        res.status(201).send(data)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  }

  // Retrieve all Metas from the database.
  const findAll = function (req: ApiRequest, res: ApiResponse) {
    db.Meta.findAll()
      .then((data) => {
        res.status(201).send(data)
      }).catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  }

  // Find a single Meta with an id
  const findOne = function (req: ApiRequest, res: ApiResponse) {
    db.Meta.findOne({
        where: {
          id: req.params.id
        },
      })
      .then((data) => {
        res.status(201).send(data as Meta | null)
      }).catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  }

  // Find the lats added Meta
  const findLatest = function (req: ApiRequest, res: ApiResponse) {
    db.Meta.findAll({
        limit: 1,
        order: [
          ['createdAt', 'DESC']
        ]
      })
      .then((data) => {
        res.status(201).send(data)
      }).catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  }

  // Update a Meta by the id in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<MetaWritePayload>(req)
    db.Meta
      .update(body, {
        where: {
          id: parseInt(paramString(req.params.id), 10)
        }
      })
      .then(() => {
        res.sendStatus(201)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  }

  // Delete a Meta with the specified id in the request
  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    db.Meta
      .destroy({
        where: {
          id: req.params.id
        }
      })
      .then(() => {
        const dir = path.join(metaFolder, req.params.id)
        fs.rmSync(dir, {
          recursive: true,
          force: true
        })
        res.sendStatus(201)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  }

  return {
    create,
    findAll,
    findOne,
    findLatest,
    update,
    deleteOne
  }
}