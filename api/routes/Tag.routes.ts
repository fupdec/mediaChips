import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const Tag = require("../controllers/Tag.controller")(db);
  const router = require("express").Router();

  // Create a new Tag
  router.post("/", Tag.create);

  // Retrieve tag count
  router.get("/count", Tag.getCount);

  // Retrieve a single Tag with id
  router.get("/:id", Tag.findOne);

  // Retrieve all Tags
  router.get("/", Tag.getAll);

  // Retrieve all Tags by metaId
  router.post("/items", Tag.getAllForItems);

  // Update a Tag with id
  router.put("/:id", Tag.update);

  // delete an Tag with id
  router.post("/deleteOne", Tag.deleteOne);

  app.use('/api/Tag', router);
};