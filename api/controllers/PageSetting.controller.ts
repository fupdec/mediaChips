import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'

const {createPageSettingsRepository} = require('../db/repositories/pageSettings')

module.exports = function (db: ApiDb) {
  const pageSettingsRepo = createPageSettingsRepository(db.drizzle)

  const create = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = pageSettingsRepo.findOrCreate(req.body)
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  const findOne = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = pageSettingsRepo.findOne({
        metaId: req.query.metaId || null,
        mediaTypeId: req.query.mediaTypeId || null,
      }) ?? null
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  const update = function (req: ApiRequest, res: ApiResponse) {
    try {
      pageSettingsRepo.update(req.body.query, req.body.data)
      res.status(201).send([1])
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  return {
    create,
    findOne,
    update,
  }
}
