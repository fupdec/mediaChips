module.exports = (app, db) => {
  const Tag = require("../controllers/Tag.controller")(db);
  const router = require("express").Router();

  // Create a new Tag
  router.post("/", Tag.create);

  // Retrieve all Tags that match the filter
  router.post("/filter", Tag.findAll);

  // Retrieve a single Tag with id
  router.get("/:id", Tag.findOne);

  // Retrieve all Tags
  router.get("/", Tag.getAll);

  // Retrieve all Tags by metaId
  router.post("/items", Tag.getAllForItems);

  // Retrieve all Tags that with name
  router.post("/search", Tag.rawQuery);

  // Update a Tag with id
  router.put("/:id", Tag.update);

  // delete an Tag with id
  router.post("/deleteOne", Tag.deleteOne);

  app.use('/api/Tag', router);
};