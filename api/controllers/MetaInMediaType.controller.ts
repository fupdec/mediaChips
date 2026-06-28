import type { ApiDb, AnyRecord } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
module.exports = function (db: ApiDb) {
  // Add meta to media type
  const create = function (req: ApiRequest, res: ApiResponse) {
    db.MetaInMediaType.create(req.body)
      .then((data) => {
        res.status(201).send(data)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  // Retrieve all MetaInMediaType from the database.
  const findAll = function (req: ApiRequest, res: ApiResponse) {
    const where: AnyRecord = {}
    let include

    if (req.query.mediaTypeId) {
      where.mediaTypeId = req.query.mediaTypeId
      include = [{model: db.Meta}]
    } else if (req.query.metaId) {
      where.metaId = req.query.metaId
      include = [{model: db.MediaType}]
    }

    const query: AnyRecord = {where, order: [['order', 'ASC']]}
    if (include) query.include = include

    db.MetaInMediaType.findAll(query).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      console.log(err)
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  // Update a MetaInMediaType by the id in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    db.MetaInMediaType.update(req.body.data, {
      where: {
        metaId: req.body.metaId,
        mediaTypeId: req.body.mediaTypeId
      }
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Delete a meta from media type with the specified id in the request
  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    db.MetaInMediaType
      .destroy({
        where: {
          metaId: parseInt(String(req.query.metaId ?? ''), 10),
          mediaTypeId: parseInt(String(req.query.mediaTypeId ?? ''), 10),
        },
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
    deleteOne,
  }
}