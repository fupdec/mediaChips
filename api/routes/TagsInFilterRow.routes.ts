import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createTagsInFilterRowController from '../controllers/TagsInFilterRow.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const TagsInFilterRow = createTagsInFilterRowController(db);
  const router = express.Router();

  // Retrieve all TagsInFilterRow
  router.get("/", TagsInFilterRow.findAll);

  app.use('/api/TagsInFilterRow', router);
}
