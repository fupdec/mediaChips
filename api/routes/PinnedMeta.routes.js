module.exports = (app, db) => {
  const PinnedMeta = require("../controllers/PinnedMeta.controller")(db);
  const router = require("express").Router();

  // Create a new PinnedMeta
  router.post("/", PinnedMeta.create);

  // Retrieve all PinnedMeta
  router.get("/", PinnedMeta.findAll);

  // Update a PinnedMeta with id
  router.put("/", PinnedMeta.update);

  // Delete a PinnedMeta with PinnedMetaId
  router.delete("/:id", PinnedMeta.deleteOne);

  app.use('/api/PinnedMeta', router);
};