import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createFilterRowsInSavedFilterController from '../controllers/FilterRowsInSavedFilter.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const FilterRowsInSavedFilter = createFilterRowsInSavedFilterController(db);
  const router = express.Router();

  // Retrieve all FilterRowsInSavedFilter
  router.get("/", FilterRowsInSavedFilter.findAll);

  app.use('/api/FilterRowsInSavedFilter', router);
}
