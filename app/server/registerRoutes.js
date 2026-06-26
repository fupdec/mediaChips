const ROUTE_FILES = [
  'PinnedMeta.routes',
  'Home.routes',
  'FilterRow.routes',
  'FilterRowsInSavedFilter.routes',
  'Tag.routes',
  'TagsInFilterRow.routes',
  'TagsInTag.routes',
  'TagsInMedia.routes',
  'Mark.routes',
  'Media.routes',
  'Playlist.routes',
  'MediaInPlaylists.routes',
  'MediaType.routes',
  'Meta.routes',
  'MetaInMediaType.routes',
  'MediaTypesInWatchedFolders.routes',
  'MetaSetting.routes',
  'PageSetting.routes',
  'SavedFilter.routes',
  'Setting.routes',
  'Tab.routes',
  'Task.routes',
  'BulkMeta.routes',
  'tasks/TasksBackups.routes',
  'ValuesInTag.routes',
  'ValuesInMedia.routes',
  'VideoMetadata.routes',
  'WatchedFolder.routes',
]

function registerApiRoutes(app, db) {
  const routeLoadErrors = []

  for (const routeFile of ROUTE_FILES) {
    try {
      require(`../../api/routes/${routeFile}`)(app, db)
    } catch (err) {
      routeLoadErrors.push({
        routeFile,
        message: err.message,
      })
      console.error(
        '\x1b[31m%s\x1b[0m',
        `Failed to register route ${routeFile}:`,
        err.stack || err.message,
      )
    }
  }

  return routeLoadErrors
}

module.exports = {
  ROUTE_FILES,
  registerApiRoutes,
}
