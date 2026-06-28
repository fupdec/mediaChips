import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
module.exports = function (db: ApiDb) {
  // Create and Save a new ValuesInMedia
  const create = function (req: ApiRequest, res: ApiResponse) {
    db.ValuesInMedia.bulkCreate(req.body).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  // Retrieve all ValuesInMedia from the database.
  const findAll = function (req: ApiRequest, res: ApiResponse) {
    db.ValuesInMedia.findAll({
      where: {
        mediaId: req.query.mediaId
      },
      include: [db.Meta],
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  // Удалить значение для медиа с конкретным ID и meta ID
  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    db.ValuesInMedia.destroy({
      where: {
        mediaId: req.body.itemId,
        metaId: req.body.metaId,
      }
    }).then(() => {
      res.sendStatus(201)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  // Delete a ValuesInMedia with the specified id in the request
  const deleteAllValuesByMediaId = function (req: ApiRequest, res: ApiResponse) {
    db.ValuesInMedia.destroy({
      where: {
        mediaId: req.params.id
      }
    }).then(() => {
      res.sendStatus(201)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  return {
    create,
    findAll,
    deleteOne,
    deleteAllValuesByMediaId,
  }
}