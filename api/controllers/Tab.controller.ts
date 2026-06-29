import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import type { TabCreatePayload, TabUpdatePayload } from '@shared/api/payloads'
import { getRequestBody } from '../types/http'

const {createTabsRepository} = require('../db/repositories/tabs')

module.exports = function (db: ApiDb) {
  const tabsRepo = createTabsRepository(db.drizzle)

  const create = function (req: ApiRequest, res: ApiResponse) {
    try {
      const body = getRequestBody<TabCreatePayload>(req)
      const data = tabsRepo.create(body)
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  const findAll = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = tabsRepo.findAll()
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  }

  const update = function (req: ApiRequest, res: ApiResponse) {
    try {
      const body = getRequestBody<TabUpdatePayload>(req)
      tabsRepo.updateById(Number(req.params.id), body)
      res.sendStatus(201)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    try {
      tabsRepo.deleteById(Number(req.params.id))
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
    update,
    deleteOne
  }
}
