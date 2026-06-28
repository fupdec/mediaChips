import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
module.exports = function (db: ApiDb) {
  // Create and Save a new SavedFilter
  const create = function (req: ApiRequest, res: ApiResponse) {
    db.PageSetting.findOrCreate({
        where: req.body
      })
      .then((data) => {
        res.status(201).send(data)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  // Find a single option with a name in the request
  const findOne = function (req: ApiRequest, res: ApiResponse) {
    db.PageSetting.findOne({
      where: {
        metaId: req.query.metaId || null,
        mediaTypeId: req.query.mediaTypeId || null
      }
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a single option with a name and value in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    db.PageSetting.update(req.body.data, {
      where: req.body.query
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };
  return {
    create,
    findOne,
    update,
  }
}