import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'

const {createMediaTypesInWatchedFoldersRepository} = require('../db/repositories/mediaTypesInWatchedFolders')

module.exports = function (db: ApiDb) {
  const mediaTypesInWatchedFoldersRepo = createMediaTypesInWatchedFoldersRepository(db.drizzle)

  const findAll = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = mediaTypesInWatchedFoldersRepo.findAllWithRelations()
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  return {
    findAll,
  }
}
