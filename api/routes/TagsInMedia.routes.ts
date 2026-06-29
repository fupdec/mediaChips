import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createTagsInMediaController from '../controllers/TagsInMedia.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const TagsInMedia = createTagsInMediaController(db);
  const router = express.Router();

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
}
