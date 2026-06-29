import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createVideoMetadataController from '../controllers/VideoMetadata.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const VideoMetadata = createVideoMetadataController(db);
  const router = express.Router();

  // Retrieve a single VideoMetadata with id
  router.get("/:id", VideoMetadata.findOne);

  // Update a VideoMetadata with id
  router.put("/:id", VideoMetadata.update);

  app.use('/api/VideoMetadata', router);
}
