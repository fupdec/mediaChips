module.exports = (app, db) => {
  const SavedFilter = require("../controllers/SavedFilter.controller")(db);
  const router = require("express").Router();

  // Create a new SavedFilter
  router.post("/", SavedFilter.create);

  router.get("/dynamicPlaylists", SavedFilter.dynamicPlaylistsSummary);

  router.get("/:id/media", SavedFilter.getPlaylistMedia);

  // Retrieve a single SavedFilter with id
  router.get("/:id", SavedFilter.findOne);

  // Retrieve all SavedFilter with params
  router.post("/findAll", SavedFilter.findAll);

  // Update a SavedFilter with id
  router.put("/:id", SavedFilter.update);

  // Delete a SavedFilter with id
  router.delete("/:id", SavedFilter.deleteOne);


  app.use('/api/SavedFilter', router);
};