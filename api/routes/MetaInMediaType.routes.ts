import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createMetaInMediaTypeController from '../controllers/MetaInMediaType.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const MetaInMediaType = createMetaInMediaTypeController(db);
  const router = express.Router();

  // Create a new MetaInMediaType
  router.post("/", MetaInMediaType.create);

  // Retrieve all MetaInMediaType
  router.get("/", MetaInMediaType.findAll);

  // Update a MetaInMediaType with id
  router.put("/", MetaInMediaType.update);

  // Delete a MetaInMediaType
  router.delete("/", MetaInMediaType.deleteOne);

  app.use('/api/MetaInMediaType', router);
}
