import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createSavedFilterController from '../controllers/SavedFilter.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const SavedFilter = createSavedFilterController(db);
  const router = express.Router();

  // Create a new SavedFilter
  router.post("/", SavedFilter.create);

  router.get("/dynamicPlaylists/basic", SavedFilter.dynamicPlaylistsBasic);

  router.get("/dynamicPlaylists", SavedFilter.dynamicPlaylistsSummary);

  router.get("/:id/summary", SavedFilter.getPlaylistSummary);

  router.get("/:id/media", SavedFilter.getPlaylistMedia);

  // Retrieve a single SavedFilter with id
  router.get("/:id", SavedFilter.findOne);

  // Retrieve all SavedFilter with params
  router.post("/findAll", SavedFilter.findAll);

  // Update a SavedFilter with id
  router.put("/:id", SavedFilter.update);

  // Delete a SavedFilter with id
  router.delete("/:id", SavedFilter.deleteOne);

  app.use('/api/SavedFilter', router);
}
