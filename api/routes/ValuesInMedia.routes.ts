import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createValuesInMediaController from '../controllers/ValuesInMedia.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const ValuesInMedia = createValuesInMediaController(db);
  const router = express.Router();

  // Create a new ValuesInMedia
  router.post("/", ValuesInMedia.create);

  // Retrieve all ValuesInMedia
  router.get("/", ValuesInMedia.findAll);

  // Удалить одну запись
  router.post("/delete", ValuesInMedia.deleteOne);

  // Delete a ValuesInMedia with id
  router.delete("/:id", ValuesInMedia.deleteAllValuesByMediaId);

  app.use('/api/ValuesInMedia', router);
}
