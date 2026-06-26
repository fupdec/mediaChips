export function getWatchedFoldersExtensions(watchedFolders) {
  const ext = {}

  watchedFolders.forEach((folder) => {
    let arr = []
    folder.types.forEach((type) => {
      arr = arr.concat(type.extensions.split(','))
    })
    ext[folder.path] = arr
  })

  return ext
}
