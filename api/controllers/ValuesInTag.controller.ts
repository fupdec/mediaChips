import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'

const {createValuesInTagRepository} = require('../db/repositories/valuesInTag')

module.exports = function (db: ApiDb) {
  const valuesInTagRepo = createValuesInTagRepository(db.drizzle)

  const create = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = valuesInTagRepo.bulkCreate(req.body)
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  const findAll = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = valuesInTagRepo.findAllByTagId(Number(req.query.tagId))
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    try {
      valuesInTagRepo.deleteOne(Number(req.body.itemId), Number(req.body.metaId))
      res.sendStatus(201)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  const deleteAllValuesByTagId = function (req: ApiRequest, res: ApiResponse) {
    try {
      valuesInTagRepo.deleteByTagId(Number(req.params.id))
      res.sendStatus(201)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  return {
    create,
    findAll,
    deleteOne,
    deleteAllValuesByTagId,
  }
}
