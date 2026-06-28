import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const PageSetting = require("../controllers/PageSetting.controller")(db);
  const router = require("express").Router();

  // Find or Create a new PageSetting
  router.post("/", PageSetting.create);

  // Retrieve all settings for one page
  router.get("/", PageSetting.findOne);

  // Update a single option with a name and value in the request
  router.put("/", PageSetting.update);

  app.use('/api/PageSetting', router);
};