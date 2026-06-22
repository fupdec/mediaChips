module.exports = (app, db) => {
  const BulkMeta = require('../controllers/BulkMeta.controller')(db)
  const router = require('express').Router()

  router.post('/apply', BulkMeta.apply)

  app.use('/api/bulk-meta', router)
}
