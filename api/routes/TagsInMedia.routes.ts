import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const TagsInMedia = require("../controllers/TagsInMedia.controller")(db);
  const router = require("express").Router();

  // Create many TagsInMedia
  router.post("/", TagsInMedia.bulkCreate);
  
  // find or create a new TagsInMedia
  router.post("/createOne", TagsInMedia.create);

  // Retrieve all TagsInMedia
  router.get("/", TagsInMedia.findAll);

  // delete specific tag for specific media
  router.post("/deleteFromMedia", TagsInMedia.deleteFromMedia);

  // удалить все теги с meta ID
  router.post("/deleteAllTagsByMetaId", TagsInMedia.deleteAllTagsByMetaId);

  // Delete all tags for specific media with mediaId
  router.delete("/:id", TagsInMedia.deleteOne);

  app.use('/api/TagsInMedia', router);
};