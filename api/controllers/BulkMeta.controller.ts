import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
const {applyBulkMetaEdit} = require('../services/bulkMetaEdit')

module.exports = function (db: ApiDb) {
  const apply = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const itemType = req.body.itemType
      const itemIds = Array.isArray(req.body.itemIds) ? req.body.itemIds.filter(Boolean) : []
      const changes = Array.isArray(req.body.changes) ? req.body.changes : []
      const presetChanges = Array.isArray(req.body.presetChanges) ? req.body.presetChanges : []

      if (!['media', 'tag'].includes(itemType)) {
        return res.status(400).send({message: 'itemType must be media or tag'})
      }

      if (!itemIds.length) {
        return res.status(400).send({message: 'itemIds are required'})
      }

      const result = await applyBulkMetaEdit(db, {
        itemType,
        itemIds,
        changes,
        presetChanges,
      })

      res.status(201).send(result)
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while applying bulk edits.',
      })
    }
  }

  return {apply}
}
