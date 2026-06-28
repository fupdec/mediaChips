import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
module.exports = function (db: ApiDb) {
  // Retrieve all FilterRowsInSavedFilter from the database.
  const findAll = async function (req: ApiRequest, res: ApiResponse) {
    db.FilterRowsInSavedFilter.findAll({
      where: {
        filterId: req.query.filterId
      },
      include: [db.FilterRow],
    }).then((data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    })
  };

  return {
    findAll,
  }
}