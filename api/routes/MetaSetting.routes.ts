import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createMetaSettingController from '../controllers/MetaSetting.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const MetaSetting = createMetaSettingController(db);
  const router = express.Router();

  // Retrieve a single MetaSetting with id
  router.get("/:id", MetaSetting.findOne);

  // Update a MetaSetting with id
  router.put("/:id", MetaSetting.update);

  app.use('/api/MetaSetting', router);
}
