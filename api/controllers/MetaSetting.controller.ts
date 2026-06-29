import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'

const {createMetaSettingsRepository} = require('../db/repositories/metaSettings')

module.exports = function (db: ApiDb) {
  const metaSettingsRepo = createMetaSettingsRepository(db.drizzle)

  const findOne = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = metaSettingsRepo.findByMetaId(Number(req.params.id)) ?? null
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  const update = function (req: ApiRequest, res: ApiResponse) {
    try {
      metaSettingsRepo.updateByMetaId(Number(req.params.id), req.body)
      res.sendStatus(201)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  return {
    findOne,
    update,
  }
}
