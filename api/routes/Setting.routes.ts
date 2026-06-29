import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createSettingController from '../controllers/Setting.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const Setting = createSettingController(db);
  const router = express.Router();

  // Retrieve all options from the database
  router.get("/", Setting.findAll);

  // Retrieve a single option with a name
  router.get("/:option", Setting.findOne);

  // Update a single option with a name and value in the request
  router.put("/:option", Setting.update);

  app.use('/api/Setting', router);
}
