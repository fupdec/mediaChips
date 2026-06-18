module.exports = (app, db) => {
  const Mark = require("../controllers/Mark.controller")(db);
  const router = require("express").Router();

  // Create a new Mark
  router.post("/", Mark.create);

  // Retrieve all Mark for video from the database.
  router.get("/video/:id", Mark.findAllForVideo);

  // Retrieve all Marks from the database.
  router.get("/", Mark.findAll);

  // Delete a Mark with id
  router.delete("/:id", Mark.deleteOne);

  app.use('/api/Mark', router);
};