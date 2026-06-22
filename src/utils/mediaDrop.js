export function collectDroppedPaths(event) {
  return Array.from(event?.dataTransfer?.files || [])
    .map((file) => file.path)
    .filter(Boolean)
}

export function startDroppedMediaAdding({paths, mediaTypeId, tasksStore, eventBus}) {
  if (!paths.length || !mediaTypeId) return false

  tasksStore.mediaAdding.media_type_id = Number(mediaTypeId)
  tasksStore.mediaAdding.directFiles = []
  tasksStore.mediaAdding.skipFileScan = false
  tasksStore.mediaAdding.paths = paths.join('\n')
  tasksStore.mediaAdding.dialogProcess = true
  tasksStore.mediaAdding.active = true
  eventBus.emit('addMedia')

  return true
}
