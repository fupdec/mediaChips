import type { ApiDb } from '../../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const TasksBackups = require("../../controllers/tasks/TasksBackups.controller")(app, db);
  const router = require("express").Router();

  router.get("/createBackup", TasksBackups.createBackup);

  // get all backups
  router.get("/getBackups", TasksBackups.getBackups);

  router.post("/deleteBackup", TasksBackups.deleteBackup);

  router.post("/restoreBackup", TasksBackups.restoreBackup);

  router.post("/importBackup", TasksBackups.importBackup);

  router.post("/exportBackup", TasksBackups.exportBackup);

  app.use('/api/TasksBackups', router);
};