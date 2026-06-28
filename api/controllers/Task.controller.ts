import type { ApiDb } from '../types/db'
import type { ApiRequest, ApiResponse } from '../types/http'
const createTaskControllerShared = require('./tasks/taskControllerShared')
const createTasksFileController = require('./tasks/TasksFile.controller')
const createTasksMediaController = require('./tasks/TasksMedia.controller')
const createTasksVideoPreviewController = require('./tasks/TasksVideoPreview.controller')
const createTasksDatabaseController = require('./tasks/TasksDatabase.controller')
const createTasksTaggingController = require('./tasks/TasksTagging.controller')
const createTasksMaintenanceController = require('./tasks/TasksMaintenance.controller')

module.exports = function (db: ApiDb) {
  const shared = createTaskControllerShared(db)

  const importSavedFilters = (req: ApiRequest, res: ApiResponse) => {
    // res.status(201).send(_saved_filters.savedFilters)
  }

  return {
    importSavedFilters,
    ...createTasksFileController(shared),
    ...createTasksMediaController(shared),
    ...createTasksVideoPreviewController(shared),
    ...createTasksDatabaseController(shared),
    ...createTasksTaggingController(shared),
    ...createTasksMaintenanceController(shared),
  }
}
