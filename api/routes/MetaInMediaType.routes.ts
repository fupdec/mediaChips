import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const MetaInMediaType = require("../controllers/MetaInMediaType.controller")(db);
  const router = require("express").Router();

  // Create a new MetaInMediaType
  router.post("/", MetaInMediaType.create);

  // Retrieve all MetaInMediaType
  router.get("/", MetaInMediaType.findAll);

  // Update a MetaInMediaType with id
  router.put("/", MetaInMediaType.update);

  // Delete a MetaInMediaType
  router.delete("/", MetaInMediaType.deleteOne);

  app.use('/api/MetaInMediaType', router);
};