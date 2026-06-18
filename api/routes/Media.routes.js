module.exports = (app, db) => {
  const Media = require("../controllers/Media.controller")(db);
  const router = require("express").Router();

  // Retrieve all Media
  router.post("/filter", Media.findAll);

  // Retrieve a single Media with id
  router.get("/numberOfMediaWithTag", Media.numberOfMediaWithTag);

  // get all media
  router.post("/items", Media.getAll);

  // get all media
  router.get("/get-stats", Media.getStats);

  // Retrieve all media that with name
  router.post("/search", Media.rawQuery);

  // update file path, name, basename and ext by path
  router.post("/updatePath", Media.updatePath);
  
  // Update a Media with id
  router.put("/:id", Media.update);

  // get a Media with id
  router.get("/:id", Media.getOneById);

  // delete a Media with id
  router.post("/deleteOne", Media.deleteOne);

  app.use('/api/Media', router);
};