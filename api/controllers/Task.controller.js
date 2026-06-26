const createTaskControllerShared = require('./tasks/taskControllerShared')
const createTasksFileController = require('./tasks/TasksFile.controller')
const createTasksMediaController = require('./tasks/TasksMedia.controller')
const createTasksVideoPreviewController = require('./tasks/TasksVideoPreview.controller')
const createTasksDatabaseController = require('./tasks/TasksDatabase.controller')
const createTasksTaggingController = require('./tasks/TasksTagging.controller')
const createTasksMaintenanceController = require('./tasks/TasksMaintenance.controller')

module.exports = function (db) {
  const shared = createTaskControllerShared(db)

  const importSavedFilters = (req, res) => {
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
