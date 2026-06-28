module.exports = (app, db) => {
  const MetaInMediaType = require("../controllers/MetaInMediaType.controller")(db);
  const router = require("express").Router();

  // Create a new MetaInMediaType
  router.post("/", MetaInMediaType.create);

  // Retrieve all MetaInMediaType
  router.get("/", MetaInMediaType.findAll);

  // Update a MetaInMediaType with id
  router.put("/", MetaInMediaType.update);

  // Delete a MetaInMediaType
  router.delete("/", MetaInMediaType.deleteOne);

  app.use('/api/MetaInMediaType', router);
};