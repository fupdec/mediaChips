const API_SEGMENT_ALIASES = {
  bulkmeta: 'bulk-meta',
  filterrow: 'FilterRow',
  filterrowsinsavedfilter: 'FilterRowsInSavedFilter',
  home: 'home',
  mark: 'Mark',
  media: 'Media',
  mediainplaylists: 'MediaInPlaylists',
  mediatype: 'MediaType',
  mediatypesinwatchedfolders: 'MediaTypesInWatchedFolders',
  meta: 'Meta',
  metainmediatype: 'MetaInMediaType',
  metasetting: 'MetaSetting',
  pagesetting: 'PageSetting',
  pinnedmeta: 'PinnedMeta',
  playlist: 'Playlist',
  savedfilter: 'SavedFilter',
  setting: 'Setting',
  tab: 'Tab',
  tag: 'Tag',
  tagsinfilterrow: 'TagsInFilterRow',
  tagsinmedia: 'TagsInMedia',
  tagsintag: 'TagsInTag',
  task: 'Task',
  tasksbackups: 'TasksBackups',
  valuesinmedia: 'ValuesInMedia',
  valuesintag: 'ValuesInTag',
  videometadata: 'VideoMetadata',
  watchedfolder: 'WatchedFolder',
}

function normalizeApiPath(url = '') {
  const match = url.match(/^\/api\/([^/?]+)(.*)$/i)
  if (!match) return url

  const segment = match[1]
  const rest = match[2]
  const canonical = API_SEGMENT_ALIASES[segment.toLowerCase()]

  if (!canonical || segment === canonical) return url

  return `/api/${canonical}${rest}`
}

module.exports = {
  normalizeApiPath,
}
