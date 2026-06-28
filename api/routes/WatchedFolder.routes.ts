module.exports = (app, db) => {
  const WatchedFolder = require("../controllers/WatchedFolder.controller")(db);
  const router = require("express").Router();

  // Create a new WatchedFolder
  router.post("/", WatchedFolder.create);

  // Update a WatchedFolder with id
  router.put("/:id", WatchedFolder.update);

  // Delete a WatchedFolder with id
  router.delete("/:id", WatchedFolder.deleteOne);

  app.use('/api/WatchedFolder', router);
};