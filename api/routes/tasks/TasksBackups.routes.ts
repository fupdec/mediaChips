import type { ApiDb } from '../../types/db'
import type { Express } from 'express'
import express from 'express'
import createTasksBackupsController from '../../controllers/tasks/TasksBackups.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const TasksBackups = createTasksBackupsController(app, db);
  const router = express.Router();

  router.get("/createBackup", TasksBackups.createBackup);

  // get all backups
  router.get("/getBackups", TasksBackups.getBackups);

  router.post("/deleteBackup", TasksBackups.deleteBackup);

  router.post("/restoreBackup", TasksBackups.restoreBackup);

  router.post("/importBackup", TasksBackups.importBackup);

  router.post("/exportBackup", TasksBackups.exportBackup);

  app.use('/api/TasksBackups', router);
}
