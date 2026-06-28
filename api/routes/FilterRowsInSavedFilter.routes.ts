module.exports = (app, db) => {
  const FilterRowsInSavedFilter = require("../controllers/FilterRowsInSavedFilter.controller")(db);
  const router = require("express").Router();

  // Retrieve all FilterRowsInSavedFilter
  router.get("/", FilterRowsInSavedFilter.findAll);

  app.use('/api/FilterRowsInSavedFilter', router);
};