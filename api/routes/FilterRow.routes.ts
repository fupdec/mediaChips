module.exports = (app, db) => {
  const FilterRow = require("../controllers/FilterRow.controller")(db);
  const router = require("express").Router();

  // Create a new FilterRow
  router.post("/", FilterRow.create);

  // Retrieve a single FilterRow with id
  router.get("/:id", FilterRow.findOne);

  // Update a FilterRow with id
  router.put("/:id", FilterRow.update);

  // Delete a FilterRow with id
  router.delete("/:id", FilterRow.deleteOne);

  app.use('/api/FilterRow', router);
};