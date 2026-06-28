import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
module.exports = function (db: ApiDb) {
  // Create many tags in media
  const bulkCreate = function (req: ApiRequest, res: ApiResponse) {
    db.TagsInMedia.bulkCreate(req.body, {ignoreDuplicates: true}).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  // Create and Save a new TagsInMedia
  const create = function (req: ApiRequest, res: ApiResponse) {
    db.TagsInMedia.findOrCreate({
      where: req.body
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  // Retrieve all TagsInMedia from the database.
  const findAll = function (req: ApiRequest, res: ApiResponse) {
    db.TagsInMedia.findAll({
      where: {
        mediaId: req.query.mediaId
      },
      include: [{
        model: db.Tag,
        attributes: ['name', 'color', 'metaId'],
        include: [{
          model: db.Meta,
          attributes: ['name', 'icon'],
        }],
      }],
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  // Delete a TagsInMedia with the specified id in the request
  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    db.TagsInMedia.destroy({
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

  // delete tag from media
  const deleteFromMedia = function (req: ApiRequest, res: ApiResponse) {
    db.TagsInMedia.destroy({
      where: {
        tagId: req.body.tagId,
        mediaId: req.body.mediaId,
      }
    }).then(() => {
      res.sendStatus(201)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  const deleteAllTagsByMetaId = function (req: ApiRequest, res: ApiResponse) {
    db.TagsInMedia.destroy({
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

  return {
    bulkCreate,
    create,
    findAll,
    deleteFromMedia,
    deleteOne,
    deleteAllTagsByMetaId,
  }
}