import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import { paramString } from '../types/errors'
module.exports = function (db: ApiDb) {
  const create = function (req: ApiRequest, res: ApiResponse) {
    db.MediaType.create(req.body).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  }

  // Retrieve all MediaType from the database.
  const findAll = function (req: ApiRequest, res: ApiResponse) {
    db.MediaType.findAll({
        raw: true
      })
      .then((data) => {
        res.status(201).send(data)
      }).catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  // Find a single MediaType with an id
  const findOne = function (req: ApiRequest, res: ApiResponse) {
    db.MediaType.findOne({
        where: {
          id: req.params.id
        },
        raw: true
      })
      .then((data) => {
        res.status(201).send(data)
      }).catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  // Update a Media by the id in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    db.MediaType
      .update(req.body, {
        where: {
          id: parseInt(paramString(req.params.id), 10)
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
  }

  // Delete a Media with the specified id in the request
  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    db.MediaType
      .destroy({
        where: {
          id: req.params.id
        }
      })
      .then(() => {
        // TODO remove folders with thumbs of media 
        // const dir = path.join(metaFolder, req.params.id)
        // fs.rmSync(dir, {
        //   recursive: true,
        //   force: true
        // })
        res.sendStatus(201)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  }

  return {
    create,
    findAll,
    findOne,
    update,
    deleteOne
  }
}