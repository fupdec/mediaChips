import type { ApiDb } from '../types/db'
import type { Express } from 'express'

import express from 'express'
import {  validateBody  } from '../middleware/validateBody'
import {  BulkMetaApplyRequestSchema  } from '../../shared/schemas/requests'
import createBulkMetaController from '../controllers/BulkMeta.controller'



export default function registerRoutes(app: Express, db: ApiDb) {
  const BulkMeta = createBulkMetaController(db)
  const router = express.Router()

  router.post('/apply', validateBody(BulkMetaApplyRequestSchema), BulkMeta.apply)

  app.use('/api/bulk-meta', router)
}
