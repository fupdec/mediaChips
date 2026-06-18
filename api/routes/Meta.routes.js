module.exports = (app, db) => {
  const Meta = require("../controllers/Meta.controller")(db);
  const router = require("express").Router();

  // Create a new Meta
  router.post("/", Meta.create);

  // Retrieve all Meta
  router.get("/", Meta.findAll);

  // Retrieve a single Meta with id
  router.get("/:id", Meta.findOne);

  // Retrieve the last added meta
  router.post("/latest", Meta.findLatest);

  // Update a Meta with id
  router.put("/:id", Meta.update);

  // Delete a Meta with id
  router.delete("/:id", Meta.deleteOne);

  app.use('/api/Meta', router);
};