import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
module.exports = function (db: ApiDb) {
  // Find a single MetaSetting with an id
  const findOne = function (req: ApiRequest, res: ApiResponse) {
    db.MetaSetting.findOne({
      where: {
        metaId: req.params.id
      }
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a MetaSetting by the id in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    db.MetaSetting
      .update(req.body, {
        where: {
          metaId: req.params.id
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
    findOne,
    update,
  }
}