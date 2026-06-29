import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createPinnedMetaController from '../controllers/PinnedMeta.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const PinnedMeta = createPinnedMetaController(db);
  const router = express.Router();

  // Create a new PinnedMeta
  router.post("/", PinnedMeta.create);

  // Retrieve all PinnedMeta
  router.get("/", PinnedMeta.findAll);

  // Update a PinnedMeta with id
  router.put("/", PinnedMeta.update);

  // Delete a PinnedMeta with PinnedMetaId
  router.delete("/:id", PinnedMeta.deleteOne);

  app.use('/api/PinnedMeta', router);
}
