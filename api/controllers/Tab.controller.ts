import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import type { TabCreatePayload, TabUpdatePayload } from '@shared/api/payloads'
import { getRequestBody } from '../types/http'

module.exports = function (db: ApiDb) {
  // Create and Save a new Tab
  const create = function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<TabCreatePayload>(req)
    db.Tab.create(body).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  // Retrieve all Tabs from the database.
  const findAll = function (req: ApiRequest, res: ApiResponse) {
    db.Tab.findAll()
      .then((data) => {
        res.status(201).send(data)
      }).catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  }

  // Update a Tab by the id in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<TabUpdatePayload>(req)
    db.Tab
      .update(body, {
        where: {
          id: req.params.id
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
  };

  // Delete a Tab with the specified id in the request
  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    db.Tab
      .destroy({
        where: {
          id: req.params.id
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
  };

  return {
    create,
    findAll,
    update,
    deleteOne
  }
}