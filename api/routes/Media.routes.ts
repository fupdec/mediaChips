import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const Media = require("../controllers/Media.controller")(db);
  const router = require("express").Router();

  // Retrieve all Media
  router.post("/filter", Media.findAll);

  // Retrieve a single Media with id
  router.get("/numberOfMediaWithTag", Media.numberOfMediaWithTag);

  // get all media
  router.post("/items", Media.getAll);

  // get filtered media ids (for bulk selection)
  router.post("/ids", Media.getFilteredIds);

  // get minimal media rows by ids (for bulk delete, etc.)
  router.post("/basics", Media.getBasicsByIds);

  // batch playlist/media thumbs
  router.post("/thumbs", Media.getThumbs);

  // get all media
  router.get("/get-stats", Media.getStats);

  // Retrieve all media that with name
  router.post("/search", Media.rawQuery);

  // update file path, name, basename and ext by path
  router.post("/updatePath", Media.updatePath);
  
  // Update a Media with id
  router.put("/:id", Media.update);

  // get a Media with id
  router.get("/:id", Media.getOneById);

  // delete a Media with id
  router.post("/deleteOne", Media.deleteOne);

  app.use('/api/Media', router);
};