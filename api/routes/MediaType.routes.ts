import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const MediaType = require("../controllers/MediaType.controller")(db);
  const router = require("express").Router();

  // Create a new MediaType
  router.post("/", MediaType.create);

  // Retrieve all MediaType
  router.get("/", MediaType.findAll);

  // Retrieve a single MediaType with id
  router.get("/:id", MediaType.findOne);

  // Update a MediaType with id
  router.put("/:id", MediaType.update);

  // Delete a MediaType with id
  router.delete("/:id", MediaType.deleteOne);

  app.use('/api/MediaType', router);
};