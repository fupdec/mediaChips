import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const ValuesInTag = require("../controllers/ValuesInTag.controller")(db);
  const router = require("express").Router();

  // Create a new ValuesInTag
  router.post("/", ValuesInTag.create);

  // Retrieve all ValuesInTag
  router.get("/", ValuesInTag.findAll);

  // Удалить одну запись
  router.post("/delete", ValuesInTag.deleteOne);

  // Delete a ValuesInTag with id
  router.delete("/:id", ValuesInTag.deleteAllValuesByTagId);

  app.use('/api/ValuesInTag', router);
};