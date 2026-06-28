import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import { paramString } from '../types/errors'
module.exports = function (db: ApiDb) {
  const {getManualPlaylistsSummary} = require('../services/playlistSummary')
  // Create and Save a new Playlist
  const create = function (req: ApiRequest, res: ApiResponse) {
    db.Playlist.create(req.body)
      .then((data) => {
        res.status(201).send(data)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  // Retrieve all Playlists from the database.
  const findAll = function (req: ApiRequest, res: ApiResponse) {
    db.Playlist.findAll({
      include: [{
        model: db.MediaInPlaylists,
      }],
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  const findSummary = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = await getManualPlaylistsSummary(db)
      res.status(201).send(data)
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while retrieving playlists.',
      })
    }
  };

  // Update a Playlist by the id in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    db.Playlist.update(req.body, {
      where: {
        id: parseInt(paramString(req.params.id), 10),
      },
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Delete a Playlist with the specified id in the request
  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    db.Playlist
      .destroy({
        where: {
          id: parseInt(paramString(req.params.id), 10),
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
    findSummary,
    update,
    deleteOne,
  }
}