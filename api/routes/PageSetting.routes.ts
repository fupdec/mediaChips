import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createPageSettingController from '../controllers/PageSetting.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const PageSetting = createPageSettingController(db);
  const router = express.Router();

  // Find or Create a new PageSetting
  router.post("/", PageSetting.create);

  // Retrieve all settings for one page
  router.get("/", PageSetting.findOne);

  // Update a single option with a name and value in the request
  router.put("/", PageSetting.update);

  app.use('/api/PageSetting', router);
}
