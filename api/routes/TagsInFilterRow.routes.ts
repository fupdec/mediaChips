import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const TagsInFilterRow = require("../controllers/TagsInFilterRow.controller")(db);
  const router = require("express").Router();

  // Retrieve all TagsInFilterRow
  router.get("/", TagsInFilterRow.findAll);

  app.use('/api/TagsInFilterRow', router);
};