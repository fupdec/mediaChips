module.exports = (app, db) => {
  const TagsInFilterRow = require("../controllers/TagsInFilterRow.controller")(db);
  const router = require("express").Router();

  // Retrieve all TagsInFilterRow
  router.get("/", TagsInFilterRow.findAll);

  app.use('/api/TagsInFilterRow', router);
};