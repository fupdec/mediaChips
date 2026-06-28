import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
const {getMarkFilterMetas, loadMarkItems} = require('../services/markItemsLoader')
const {deleteMarkGeneratedAsset} = require('../services/localAssetCleanup')

module.exports = function (db: ApiDb) {
  const dbPath = db.path
  // Create and Save a new Mark
  const create = function (req: ApiRequest, res: ApiResponse) {
    db.Mark.create(req.body).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  // Retrieve all Mark for video from the database.
  const findAllForVideo = function (req: ApiRequest, res: ApiResponse) {
    db.Mark.findAll({
        where: {
          mediaId: req.params.id
        },
        order: [
          ['time', 'ASC']
        ],
        include: [db.Tag],
        raw: true
      })
      .then(async (marks) => {
        for (let mark of marks) {
          let meta = await db.Meta.findOne({
            where: {
              id: mark['tag.metaId']
            },
            raw: true
          })
          mark.meta = meta
        }
        res.status(201).send(marks)
      }).catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  // Retrieve all Marks from the database.
  const findAll = function (req: ApiRequest, res: ApiResponse) {
    db.Mark.findAll({
      include: [{
        model: db.Tag,
        include: [{
          model: db.Meta,
        }],
      }, db.Media],
      })
      .then((marks) => {
        res.status(201).send(marks)
      }).catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  const getItems = function (req: ApiRequest, res: ApiResponse) {
    loadMarkItems(db, req.body || {})
      .then((data: unknown) => {
        res.status(201).send(data)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  }

  const getFilterMetas = function (req: ApiRequest, res: ApiResponse) {
    getMarkFilterMetas(db)
      .then((data: unknown) => {
        res.status(201).send(data)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  }

  // Delete a Mark with the specified id in the request
  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    const markId = req.params.id

    deleteMarkGeneratedAsset(dbPath, markId)

    db.Mark
      .destroy({
        where: {
          id: markId,
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
    findAllForVideo,
    findAll,
    getItems,
    getFilterMetas,
    deleteOne
  }
}