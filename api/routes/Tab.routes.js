module.exports = (app, db) => {
  const Tab = require("../controllers/Tab.controller")(db);
  const router = require("express").Router();

  // Create a new Tab
  router.post("/", Tab.create);

  // Retrieve all Tab
  router.get("/", Tab.findAll);

  // Update a Tab with id
  router.put("/:id", Tab.update);

  // Delete a Tab with id
  router.delete("/:id", Tab.deleteOne);

  app.use('/api/Tab', router);
};