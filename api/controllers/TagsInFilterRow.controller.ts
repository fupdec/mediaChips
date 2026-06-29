import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'

import { createTagsInFilterRowsRepository } from '../db/repositories/tagsInFilterRows'
export default function (db: ApiDb) {
  const tagsInFilterRowsRepo = createTagsInFilterRowsRepository(db.drizzle)

  const findAll = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = tagsInFilterRowsRepo.findByRowId(Number(req.query.rowId))
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
