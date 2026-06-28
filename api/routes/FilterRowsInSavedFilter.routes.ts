import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const FilterRowsInSavedFilter = require("../controllers/FilterRowsInSavedFilter.controller")(db);
  const router = require("express").Router();

  // Retrieve all FilterRowsInSavedFilter
  router.get("/", FilterRowsInSavedFilter.findAll);

  app.use('/api/FilterRowsInSavedFilter', router);
};