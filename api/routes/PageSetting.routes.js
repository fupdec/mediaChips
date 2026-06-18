module.exports = (app, db) => {
  const PageSetting = require("../controllers/PageSetting.controller")(db);
  const router = require("express").Router();

  // Find or Create a new PageSetting
  router.post("/", PageSetting.create);

  // Retrieve all settings for one page
  router.get("/", PageSetting.findOne);

  // Update a single option with a name and value in the request
  router.put("/", PageSetting.update);

  app.use('/api/PageSetting', router);
};