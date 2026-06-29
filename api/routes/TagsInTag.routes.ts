import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createTagsInTagController from '../controllers/TagsInTag.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const TagsInTag = createTagsInTagController(db);
  const router = express.Router();

  // Create a new TagsInTag
  router.post("/", TagsInTag.bulkCreate);

  // find or create a new TagsInTag
  router.post("/createOne", TagsInTag.create);

  // Retrieve all TagsInTag
  router.get("/", TagsInTag.findAll);

  // Delete a TagsInTag with id
  router.delete("/:id", TagsInTag.deleteOne);

  // delete specific tag for specific tag
  router.post("/deleteAllTagsByMetaId", TagsInTag.deleteAllTagsByMetaId);

  // delete specific tag for specific tag
  router.post("/deleteFromTag", TagsInTag.deleteFromTag);

  app.use('/api/TagsInTag', router);
}
