import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
const {getMarkFilterMetas, loadMarkItems} = require('../services/markItemsLoader')
const {deleteMarkGeneratedAsset} = require('../services/localAssetCleanup')
const {createMarksRepository} = require('../db/repositories/marks')

module.exports = function (db: ApiDb) {
  const marksRepo = createMarksRepository(db.drizzle)
  const getDbPath = () => db.path!

  const create = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = marksRepo.create(req.body)
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  const findAllForVideo = function (req: ApiRequest, res: ApiResponse) {
    try {
      const marks = marksRepo.findAllForVideo(Number(req.params.id))
      res.status(201).send(marks)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  const findAll = function (req: ApiRequest, res: ApiResponse) {
    try {
      const marks = marksRepo.findAllWithRelations()
      res.status(201).send(marks)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
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

  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    const markId = req.params.id

    deleteMarkGeneratedAsset(getDbPath(), markId)

    try {
      marksRepo.deleteById(Number(markId))
      res.sendStatus(201)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
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
