import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const MetaSetting = require("../controllers/MetaSetting.controller")(db);
  const router = require("express").Router();

  // Retrieve a single MetaSetting with id
  router.get("/:id", MetaSetting.findOne);

  // Update a MetaSetting with id
  router.put("/:id", MetaSetting.update);

  app.use('/api/MetaSetting', router);
};