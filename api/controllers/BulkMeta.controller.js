const {applyBulkMetaEdit} = require('../services/bulkMetaEdit')

module.exports = function (db) {
  const apply = async function (req, res) {
    try {
      const itemType = req.body.itemType
      const itemIds = Array.isArray(req.body.itemIds) ? req.body.itemIds.filter(Boolean) : []
      const changes = Array.isArray(req.body.changes) ? req.body.changes : []

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
      })

      res.status(201).send(result)
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while applying bulk edits.',
      })
    }
  }

  return {apply}
}
