import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import { paramString } from '../types/errors'
module.exports = function (db: ApiDb) {
  // Find a single VideoMetadata with an id
  const findOne = function (req: ApiRequest, res: ApiResponse) {
    db.VideoMetadata.findOne({
      where: {
        mediaId: req.params.id,
      },
      raw: true
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a VideoMetadata by the id in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    db.VideoMetadata
      .update(req.body, {
        where: {
          mediaId: parseInt(paramString(req.params.id), 10)
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