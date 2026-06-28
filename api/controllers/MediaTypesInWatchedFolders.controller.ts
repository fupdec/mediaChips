import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
module.exports = function (db: ApiDb) {
  // Retrieve all MediaTypesInWatchedFolders from the database.
  const findAll = function (req: ApiRequest, res: ApiResponse) {
    db.MediaTypesInWatchedFolders
      .findAll({
        include: [db.MediaType, db.WatchedFolder]
      })
      .then((data) => {
        res.status(201).send(data)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  return {
    findAll,
  }
}