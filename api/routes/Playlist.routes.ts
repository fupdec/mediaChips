module.exports = (app, db) => {
  const Playlist = require("../controllers/Playlist.controller")(db);
  const router = require("express").Router();

  // Create a new Playlist
  router.post("/", Playlist.create);

  // Retrieve all Playlist
  router.get("/", Playlist.findAll);

  // Lightweight playlist list for the playlists page
  router.get("/summary", Playlist.findSummary);

  // Update a Playlist with id
  router.put("/:id", Playlist.update);

  // Delete a Playlist with id
  router.delete("/:id", Playlist.deleteOne);

  app.use('/api/Playlist', router);
};