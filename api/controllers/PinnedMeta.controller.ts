import type { ApiDb, AnyRecord } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import { getRequestBody } from '../types/http'
import type { MetaAssignmentOrderPayload, PinChildMetaPayload } from '@shared/api/payloads'
import { paramString } from '../types/errors'
module.exports = function (db: ApiDb) {
  // Create and Save a new PinnedMeta
  const create = function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<PinChildMetaPayload>(req)
    db.PinnedMeta.create(body)
      .then((data) => {
        res.status(201).send(data)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  // Retrieve all PinnedMetas from the database.
  const findAll = function (req: ApiRequest, res: ApiResponse) {
    let where: AnyRecord = {}
    if (req.query.metaId) where.metaId = req.query.metaId
    if (req.query.pinnedMetaId) where.pinnedMetaId = req.query.pinnedMetaId

    db.PinnedMeta.findAll({
      where: where,
      include: [{
        model: db.Meta,
      }],
      order: [['order', 'ASC']],
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // получить мета по ID прикрепленной меты
  const findAllByPinnedMetaId = function (req: ApiRequest, res: ApiResponse) {
    db.PinnedMeta.findAll({
      where: {
        pinnedMetaId: req.query.metaId
      },
      include: [{
        model: db.Meta,
      }],
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a PinnedMeta by the id in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    const body = getRequestBody<MetaAssignmentOrderPayload>(req)
    db.PinnedMeta.update(body.data, {
      where: {
        metaId: body.metaId,
        pinnedMetaId: body.pinnedMetaId
      }
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Delete a PinnedMeta with the specified id in the request
  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    db.PinnedMeta
      .destroy({
        where: {
          pinnedMetaId: parseInt(paramString(req.params.id), 10),
          metaId: parseInt(String(req.query.metaId ?? ''), 10)
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
    findAllByPinnedMetaId,
    update,
    deleteOne,
  }
}