import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const ValuesInMedia = require("../controllers/ValuesInMedia.controller")(db);
  const router = require("express").Router();

  // Create a new ValuesInMedia
  router.post("/", ValuesInMedia.create);

  // Retrieve all ValuesInMedia
  router.get("/", ValuesInMedia.findAll);

  // Удалить одну запись
  router.post("/delete", ValuesInMedia.deleteOne);

  // Delete a ValuesInMedia with id
  router.delete("/:id", ValuesInMedia.deleteAllValuesByMediaId);

  app.use('/api/ValuesInMedia', router);
};