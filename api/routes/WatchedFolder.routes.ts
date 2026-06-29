import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createWatchedFolderController from '../controllers/WatchedFolder.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const WatchedFolder = createWatchedFolderController(db);
  const router = express.Router();

  // Create a new WatchedFolder
  router.post("/", WatchedFolder.create);

  // Update a WatchedFolder with id
  router.put("/:id", WatchedFolder.update);

  // Delete a WatchedFolder with id
  router.delete("/:id", WatchedFolder.deleteOne);

  app.use('/api/WatchedFolder', router);
}
