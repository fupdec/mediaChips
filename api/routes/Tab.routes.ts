import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createTabController from '../controllers/Tab.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const Tab = createTabController(db);
  const router = express.Router();

  // Create a new Tab
  router.post("/", Tab.create);

  // Retrieve all Tab
  router.get("/", Tab.findAll);

  // Update a Tab with id
  router.put("/:id", Tab.update);

  // Delete a Tab with id
  router.delete("/:id", Tab.deleteOne);

  app.use('/api/Tab', router);
}
