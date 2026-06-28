import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const MediaTypesInWatchedFolders = require("../controllers/MediaTypesInWatchedFolders.controller")(db);
  const router = require("express").Router();

  // Retrieve all MediaTypesInWatchedFolders
  router.get("/", MediaTypesInWatchedFolders.findAll);

  app.use('/api/MediaTypesInWatchedFolders', router);
};