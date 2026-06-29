import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createFilterRowController from '../controllers/FilterRow.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const FilterRow = createFilterRowController(db);
  const router = express.Router();

  // Create a new FilterRow
  router.post("/", FilterRow.create);

  // Retrieve a single FilterRow with id
  router.get("/:id", FilterRow.findOne);

  // Update a FilterRow with id
  router.put("/:id", FilterRow.update);

  // Delete a FilterRow with id
  router.delete("/:id", FilterRow.deleteOne);

  app.use('/api/FilterRow', router);
}
