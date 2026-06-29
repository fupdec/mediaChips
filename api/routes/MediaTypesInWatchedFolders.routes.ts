import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createMediaTypesInWatchedFoldersController from '../controllers/MediaTypesInWatchedFolders.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const MediaTypesInWatchedFolders = createMediaTypesInWatchedFoldersController(db);
  const router = express.Router();

  // Retrieve all MediaTypesInWatchedFolders
  router.get("/", MediaTypesInWatchedFolders.findAll);

  app.use('/api/MediaTypesInWatchedFolders', router);
}
