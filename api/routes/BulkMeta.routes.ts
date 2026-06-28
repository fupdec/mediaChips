import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const BulkMeta = require('../controllers/BulkMeta.controller')(db)
  const router = require('express').Router()

  router.post('/apply', BulkMeta.apply)

  app.use('/api/bulk-meta', router)
}
