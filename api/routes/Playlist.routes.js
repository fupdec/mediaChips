module.exports = (app, db) => {
  const Playlist = require("../controllers/Playlist.controller")(db);
  const router = require("express").Router();

  // Create a new Playlist
  router.post("/", Playlist.create);

  // Retrieve all Playlist
  router.get("/", Playlist.findAll);

  // Update a Playlist with id
  router.put("/:id", Playlist.update);

  // Delete a Playlist with id
  router.delete("/:id", Playlist.deleteOne);

  app.use('/api/Playlist', router);
};