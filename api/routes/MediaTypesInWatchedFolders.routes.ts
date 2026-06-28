module.exports = (app, db) => {
  const MediaTypesInWatchedFolders = require("../controllers/MediaTypesInWatchedFolders.controller")(db);
  const router = require("express").Router();

  // Retrieve all MediaTypesInWatchedFolders
  router.get("/", MediaTypesInWatchedFolders.findAll);

  app.use('/api/MediaTypesInWatchedFolders', router);
};