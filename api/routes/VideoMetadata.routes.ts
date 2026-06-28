import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const VideoMetadata = require("../controllers/VideoMetadata.controller")(db);
  const router = require("express").Router();

  // Retrieve a single VideoMetadata with id
  router.get("/:id", VideoMetadata.findOne);

  // Update a VideoMetadata with id
  router.put("/:id", VideoMetadata.update);

  app.use('/api/VideoMetadata', router);
};