import type { AnyRecord } from './types/db'
const Sequelize = require('sequelize');

module.exports = function (sequelize: import('sequelize').Sequelize) {
  const db: AnyRecord = {};

  db.Sequelize = Sequelize;
  db.sequelize = sequelize;

  const PinnedMeta = require("./models/PinnedMeta.model")(sequelize, Sequelize);
  const FilterRow = require("./models/FilterRow.model")(sequelize, Sequelize);
  const FilterRowsInSavedFilter = require("./models/FilterRowsInSavedFilter.model")(sequelize, Sequelize);
  const Tag = require("./models/Tag.model")(sequelize, Sequelize);
  const TagsInFilterRow = require("./models/TagsInFilterRow.model")(sequelize, Sequelize);
  const TagsInTag = require("./models/TagsInTag.model")(sequelize, Sequelize);
  const TagsInMedia = require("./models/TagsInMedia.model")(sequelize, Sequelize);
  const Mark = require("./models/Mark.model")(sequelize, Sequelize);
  const Media = require("./models/Media.model")(sequelize, Sequelize);
  const Playlist = require("./models/Playlist.model")(sequelize, Sequelize);
  const MediaInPlaylists = require("./models/MediaInPlaylists.model")(sequelize, Sequelize);
  const MediaType = require("./models/MediaType.model")(sequelize, Sequelize);
  const MediaTypesInWatchedFolders = require("./models/MediaTypesInWatchedFolders.model")(sequelize, Sequelize);
  const Meta = require("./models/Meta.model")(sequelize, Sequelize);
  const MetaInMediaType = require("./models/MetaInMediaType.model")(sequelize, Sequelize);
  const MetaSetting = require("./models/MetaSetting.model")(sequelize, Sequelize);
  const PageSetting = require("./models/PageSetting.model")(sequelize, Sequelize);
  const SavedFilter = require("./models/SavedFilter.model")(sequelize, Sequelize);
  const Setting = require("./models/Setting.model")(sequelize, Sequelize);
  const Tab = require("./models/Tab.model")(sequelize, Sequelize);
  const ValuesInTag = require("./models/ValuesInTag.model")(sequelize, Sequelize);
  const ValuesInMedia = require("./models/ValuesInMedia.model")(sequelize, Sequelize);
  const VideoMetadata = require("./models/VideoMetadata.model")(sequelize, Sequelize);
  const ImageMetadata = require("./models/ImageMetadata.model")(sequelize, Sequelize);
  const WatchedFolder = require("./models/WatchedFolder.model")(sequelize, Sequelize);


  // RELATIONS
  MediaType.hasMany(Media, {
    foreignKey: 'mediaTypeId',
    onDelete: "cascade"
  })
  Media.belongsTo(MediaType, {
    foreignKey: 'mediaTypeId'
  })

  VideoMetadata.removeAttribute('id')
  Media.hasOne(VideoMetadata, {
    onDelete: "cascade",
    foreignKey: 'mediaId'
  })
  VideoMetadata.belongsTo(Media, {
    foreignKey: 'mediaId'
  })

  ImageMetadata.removeAttribute('id')
  Media.hasOne(ImageMetadata, {
    onDelete: "cascade",
    foreignKey: 'mediaId'
  })
  ImageMetadata.belongsTo(Media, {
    foreignKey: 'mediaId'
  })

  MetaSetting.removeAttribute('id')
  Meta.hasOne(MetaSetting, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  MetaSetting.belongsTo(Meta, {
    foreignKey: 'metaId'
  })

  PageSetting.removeAttribute('id')
  Meta.hasMany(PageSetting, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  PageSetting.belongsTo(Meta, {
    foreignKey: 'metaId'
  })
  MediaType.hasMany(PageSetting, {
    foreignKey: 'mediaTypeId',
    onDelete: "cascade"
  })
  PageSetting.belongsTo(MediaType, {
    foreignKey: 'mediaTypeId'
  })
  Tag.hasMany(PageSetting, {
    foreignKey: 'tagId',
    onDelete: "cascade"
  })
  PageSetting.belongsTo(Tag, {
    foreignKey: 'tagId'
  })

  MetaInMediaType.removeAttribute('id')
  Meta.hasMany(MetaInMediaType, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  MetaInMediaType.belongsTo(Meta, {
    foreignKey: 'metaId'
  })
  MediaType.hasMany(MetaInMediaType, {
    foreignKey: 'mediaTypeId',
    onDelete: "cascade"
  })
  MetaInMediaType.belongsTo(MediaType, {
    foreignKey: 'mediaTypeId'
  })

  Meta.hasOne(Tag, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  Tag.belongsTo(Meta, {
    foreignKey: 'metaId'
  })

  TagsInMedia.removeAttribute('id')
  Tag.hasMany(TagsInMedia, {
    foreignKey: 'tagId',
    onDelete: "cascade"
  })
  TagsInMedia.belongsTo(Tag, {
    foreignKey: 'tagId'
  })
  Media.hasMany(TagsInMedia, {
    foreignKey: 'mediaId',
    onDelete: "cascade"
  })
  TagsInMedia.belongsTo(Media, {
    foreignKey: 'mediaId'
  })
  Meta.hasMany(TagsInMedia, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  TagsInMedia.belongsTo(Meta, {
    foreignKey: 'metaId'
  })

  ValuesInMedia.removeAttribute('id')
  Meta.hasMany(ValuesInMedia, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  ValuesInMedia.belongsTo(Meta, {
    foreignKey: 'metaId'
  })
  Media.hasMany(ValuesInMedia, {
    foreignKey: 'mediaId',
    onDelete: "cascade"
  })
  ValuesInMedia.belongsTo(Media, {
    foreignKey: 'mediaId'
  })

  TagsInTag.removeAttribute('id')
  Tag.hasMany(TagsInTag, {
    foreignKey: 'parentTagId',
    onDelete: "cascade"
  })
  TagsInTag.belongsTo(Tag, {
    foreignKey: 'parentTagId'
  })
  Tag.hasMany(TagsInTag, {
    foreignKey: 'tagId',
    onDelete: "cascade"
  })
  TagsInTag.belongsTo(Tag, {
    foreignKey: 'tagId'
  })
  Meta.hasMany(TagsInTag, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  TagsInTag.belongsTo(Meta, {
    foreignKey: 'metaId'
  })

  ValuesInTag.removeAttribute('id')
  Meta.hasMany(ValuesInTag, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  ValuesInTag.belongsTo(Meta, {
    foreignKey: 'metaId'
  })
  Tag.hasMany(ValuesInTag, {
    foreignKey: 'tagId',
    onDelete: "cascade"
  })
  ValuesInTag.belongsTo(Tag, {
    foreignKey: 'tagId'
  })

  Tag.hasMany(Mark, {
    foreignKey: 'tagId',
    onDelete: "cascade"
  })
  Mark.belongsTo(Tag, {
    foreignKey: 'tagId'
  })
  Media.hasMany(Mark, {
    foreignKey: 'mediaId',
    onDelete: "cascade"
  })
  Mark.belongsTo(Media, {
    foreignKey: 'mediaId'
  })

  PinnedMeta.removeAttribute('id')
  Meta.hasMany(PinnedMeta, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  PinnedMeta.belongsTo(Meta, {
    foreignKey: 'metaId'
  })
  Meta.hasMany(PinnedMeta, {
    foreignKey: 'pinnedMetaId',
    onDelete: "cascade"
  })
  PinnedMeta.belongsTo(Meta, {
    foreignKey: 'pinnedMetaId'
  })

  MediaTypesInWatchedFolders.removeAttribute('id')
  WatchedFolder.hasMany(MediaTypesInWatchedFolders, {
    foreignKey: 'folderId',
    onDelete: "cascade"
  })
  MediaTypesInWatchedFolders.belongsTo(WatchedFolder, {
    foreignKey: 'folderId'
  })
  MediaType.hasMany(MediaTypesInWatchedFolders, {
    foreignKey: 'mediaTypeId',
    onDelete: "cascade"
  })
  MediaTypesInWatchedFolders.belongsTo(MediaType, {
    foreignKey: 'mediaTypeId'
  })

  MediaInPlaylists.removeAttribute('id')
  Playlist.hasMany(MediaInPlaylists, {
    foreignKey: 'playlistId',
    onDelete: "cascade"
  })
  MediaInPlaylists.belongsTo(Playlist, {
    foreignKey: 'playlistId'
  })
  Media.hasMany(MediaInPlaylists, {
    foreignKey: 'mediaId',
    onDelete: "cascade"
  })
  MediaInPlaylists.belongsTo(Media, {
    foreignKey: 'mediaId'
  })

  Meta.hasMany(FilterRow, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  FilterRow.belongsTo(Meta, {
    foreignKey: 'metaId'
  })

  Meta.hasMany(SavedFilter, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  SavedFilter.belongsTo(Meta, {
    foreignKey: 'metaId'
  })
  MediaType.hasMany(SavedFilter, {
    foreignKey: 'mediaTypeId',
    onDelete: "cascade"
  })
  SavedFilter.belongsTo(MediaType, {
    foreignKey: 'mediaTypeId'
  })
  Tag.hasMany(SavedFilter, {
    foreignKey: 'tagId',
    onDelete: "cascade"
  })
  SavedFilter.belongsTo(Tag, {
    foreignKey: 'tagId'
  })
  SavedFilter.hasMany(PageSetting, {
    foreignKey: 'filterId',
    onDelete: "cascade"
  })
  PageSetting.belongsTo(SavedFilter, {
    foreignKey: 'filterId'
  })

  FilterRowsInSavedFilter.removeAttribute('id')
  SavedFilter.hasMany(FilterRowsInSavedFilter, {
    foreignKey: 'filterId',
    onDelete: "cascade"
  })
  FilterRowsInSavedFilter.belongsTo(SavedFilter, {
    foreignKey: 'filterId'
  })
  FilterRow.hasMany(FilterRowsInSavedFilter, {
    foreignKey: 'rowId',
    onDelete: "cascade"
  })
  FilterRowsInSavedFilter.belongsTo(FilterRow, {
    foreignKey: 'rowId'
  })

  TagsInFilterRow.removeAttribute('id')
  Tag.hasMany(TagsInFilterRow, {
    foreignKey: 'tagId',
    onDelete: "cascade"
  })
  TagsInFilterRow.belongsTo(Tag, {
    foreignKey: 'tagId'
  })
  Meta.hasMany(TagsInFilterRow, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  TagsInFilterRow.belongsTo(Meta, {
    foreignKey: 'metaId'
  })
  FilterRow.hasMany(TagsInFilterRow, {
    foreignKey: 'rowId',
    onDelete: "cascade"
  })
  TagsInFilterRow.belongsTo(FilterRow, {
    foreignKey: 'rowId'
  })

  Meta.hasMany(Tab, {
    foreignKey: 'metaId',
    onDelete: "cascade"
  })
  Tab.belongsTo(Meta, {
    foreignKey: 'metaId'
  })
  MediaType.hasMany(Tab, {
    foreignKey: 'mediaTypeId',
    onDelete: "cascade"
  })
  Tab.belongsTo(MediaType, {
    foreignKey: 'mediaTypeId'
  })
  Tag.hasMany(Tab, {
    foreignKey: 'tagId',
    onDelete: "cascade"
  })
  Tab.belongsTo(Tag, {
    foreignKey: 'tagId'
  })
  Tab.hasMany(PageSetting, {
    foreignKey: 'tabId',
    onDelete: "cascade"
  })
  PageSetting.belongsTo(Tab, {
    foreignKey: 'tabId'
  })
  Tab.hasMany(SavedFilter, {
    foreignKey: 'tabId',
    onDelete: "cascade"
  })
  SavedFilter.belongsTo(Tab, {
    foreignKey: 'tabId'
  })


  db.PinnedMeta = PinnedMeta
  db.FilterRow = FilterRow
  db.FilterRowsInSavedFilter = FilterRowsInSavedFilter
  db.Tag = Tag
  db.TagsInFilterRow = TagsInFilterRow
  db.TagsInTag = TagsInTag
  db.TagsInMedia = TagsInMedia
  db.Mark = Mark
  db.Media = Media
  db.MediaType = MediaType
  db.MediaTypesInWatchedFolders = MediaTypesInWatchedFolders
  db.Playlist = Playlist
  db.MediaInPlaylists = MediaInPlaylists
  db.Meta = Meta
  db.MetaInMediaType = MetaInMediaType
  db.MetaSetting = MetaSetting
  db.PageSetting = PageSetting
  db.SavedFilter = SavedFilter
  db.Setting = Setting
  db.Tab = Tab
  db.ValuesInTag = ValuesInTag
  db.ValuesInMedia = ValuesInMedia
  db.VideoMetadata = VideoMetadata
  db.ImageMetadata = ImageMetadata
  db.WatchedFolder = WatchedFolder

  return db
}