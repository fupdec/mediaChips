module.exports = (app, db) => {
  const TagsInTag = require("../controllers/TagsInTag.controller")(db);
  const router = require("express").Router();

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
};