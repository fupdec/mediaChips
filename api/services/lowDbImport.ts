import type { ApiDb, AnyRecord } from '../types/db'
import type {
  LowDbImportObject,
  LowDbTagsByMetaId,
  OldIdMapping,
  SettingOptionRow,
} from '../types/migration'

const {createMediaRepository} = require('../db/repositories/media')
const {createVideoMetadataRepository} = require('../db/repositories/videoMetadata')
const {createSettingsRepository} = require('../db/repositories/settings')
const {createMetaRepository} = require('../db/repositories/meta')
const {createTagsRepository} = require('../db/repositories/tags')
const {createMetaInMediaTypesRepository} = require('../db/repositories/metaInMediaTypes')
const {createPlaylistsRepository} = require('../db/repositories/playlists')
const {createMediaInPlaylistsRepository} = require('../db/repositories/mediaInPlaylists')
const {createMarksRepository} = require('../db/repositories/marks')
const {createTagsInMediaRepository} = require('../db/repositories/tagsInMedia')
const {createValuesInMediaRepository} = require('../db/repositories/valuesInMedia')
const {createPinnedMetaRepository} = require('../db/repositories/pinnedMeta')
const {createTagsInTagRepository} = require('../db/repositories/tagsInTag')
const {createValuesInTagRepository} = require('../db/repositories/valuesInTag')
const {createWatchedFoldersRepository} = require('../db/repositories/watchedFolders')
const {createMediaTypesInWatchedFoldersRepository} = require('../db/repositories/mediaTypesInWatchedFolders')

async function importLowDbData(db: ApiDb, obj: LowDbImportObject) {
  const mediaRepo = createMediaRepository(db.drizzle)
  const videoMetadataRepo = createVideoMetadataRepository(db.drizzle)
  const settingsRepo = createSettingsRepository(db.drizzle)
  const metaRepo = createMetaRepository(db.drizzle)
  const tagsRepo = createTagsRepository(db.drizzle, db.sqlite)
  const metaInMediaTypesRepo = createMetaInMediaTypesRepository(db.drizzle)
  const playlistsRepo = createPlaylistsRepository(db.drizzle)
  const mediaInPlaylistsRepo = createMediaInPlaylistsRepository(db.drizzle)
  const marksRepo = createMarksRepository(db.drizzle)
  const tagsInMediaRepo = createTagsInMediaRepository(db.drizzle)
  const valuesInMediaRepo = createValuesInMediaRepository(db.drizzle)
  const pinnedMetaRepo = createPinnedMetaRepository(db.drizzle)
  const tagsInTagRepo = createTagsInTagRepository(db.drizzle)
  const valuesInTagRepo = createValuesInTagRepository(db.drizzle)
  const watchedFoldersRepo = createWatchedFoldersRepository(db.drizzle)
  const mediaTypesInWatchedFoldersRepo = createMediaTypesInWatchedFoldersRepository(db.drizzle)

  mediaRepo.bulkCreate(obj.videos)
  let mediaIds: OldIdMapping[] = mediaRepo.findOldIdMappings()

  const videoMetadata = obj.videoMetadata
    .map((video: AnyRecord) => {
      const media = mediaIds.find((x) => x.oldId === video.oldId)
      if (!media) return null
      return {
        mediaId: media.id,
        duration: video.duration,
        width: video.width,
        height: video.height,
      }
    })
    .filter(Boolean)

  videoMetadataRepo.bulkCreate(videoMetadata)

  const {loadDefaultSettingsList} = require('../utils/defaultSettings')
  const settings = obj.settings
  const settingsList = loadDefaultSettingsList()
  const allowed = settingsList.map((i: SettingOptionRow) => i.option)
  const filteredOptions = Object.keys(settings)
    .filter((key: string) => allowed.includes(key))
    .reduce((acc: Record<string, unknown>, key: string) => {
      acc[key] = settings[key]
      return acc
    }, {})

  settingsRepo.bulkUpsertByOptions(
    Object.entries(filteredOptions).map(([option, value]) => ({option, value})),
  )

  for (const m of obj.meta) {
    try {
      const cm = metaRepo.create(m)
      if (cm.type === 'array') {
        metaRepo.ensureArrayMetaResources(cm.id)
      }
    } catch (e: unknown) {
      console.log(e)
    }
  }

  let metaIds: OldIdMapping[] = metaRepo.findOldIdMappings()

  for (const tags of obj.tags) {
    for (const i in tags) {
      const meta = metaIds.find((x) => x.oldId === i)
      if (!meta) continue

      const newTags = (tags as LowDbTagsByMetaId)[i].map((it: AnyRecord) => ({
        ...it,
        metaId: meta.id,
      }))
      tagsRepo.bulkCreate(newTags)
    }
  }

  let tagsIds: OldIdMapping[] = tagsRepo.findOldIdMappings()

  for (const i of (obj.settings.metaAssignedToVideos as Array<{ id: unknown }>)) {
    const meta = metaIds.find((x) => x.oldId === i.id)
    if (!meta) continue
    metaInMediaTypesRepo.create({
      mediaTypeId: 1,
      metaId: meta.id,
    })
  }

  playlistsRepo.bulkCreate(obj.playlists)

  for (const playlist of obj.playlists) {
    const p = playlistsRepo.findByOldId(playlist.oldId)
    if (!p) continue

    const playlistVideos = Array.isArray(playlist.videos) ? playlist.videos : []
    for (const videoOldId of playlistVideos) {
      const media = mediaIds.find((x) => x.oldId === videoOldId)
      if (!media) continue

      mediaInPlaylistsRepo.create({
        playlistId: p.id,
        mediaId: media.id,
        order: playlistVideos.indexOf(videoOldId),
      })
    }
  }

  const marks: AnyRecord[] = []
  for (const mark of obj.marks) {
    const found = mediaIds.find((x) => x.oldId === mark.videoId)
    if (!found) continue

    const nextMark: AnyRecord = {...mark, mediaId: found.id}
    if (nextMark.type === 'favorite' && nextMark.text === '') nextMark.text = null
    else if (nextMark.type === 'meta') {
      const foundTag = tagsIds.find((x) => x.oldId === nextMark.oldTagId)
      if (!foundTag) continue
      nextMark.tagId = foundTag.id
    }
    marks.push(nextMark)
  }
  marksRepo.bulkCreate(marks)

  const tagsInMedia: AnyRecord[] = []
  const valuesInMedia: AnyRecord[] = []
  for (const videoMeta of obj.onlyMeta) {
    const mVideo = mediaIds.find((x) => x.oldId === videoMeta.id)
    if (!mVideo) continue

    const onlyMetaFields = Object.fromEntries(
      Object.entries(videoMeta).filter(([key]) => !key.includes('id')),
    )

    for (const fieldName in onlyMetaFields) {
      const m = metaIds.find((x) => x.oldId === fieldName)
      if (!m) continue

      const val = onlyMetaFields[fieldName]
      if (m.type === 'array') {
        for (const tag of val as Array<string | number>) {
          const metaTag = tagsIds.find((x) => x.oldId === tag)
          if (!metaTag) continue
          tagsInMedia.push({
            metaId: m.id,
            mediaId: mVideo.id,
            tagId: metaTag.id,
          })
        }
      } else if (val !== null && val !== '' && val !== 0 && val !== '0') {
        valuesInMedia.push({
          value: String(val),
          metaId: m.id,
          mediaId: mVideo.id,
        })
      }
    }
  }

  if (tagsInMedia.length) tagsInMediaRepo.bulkCreate(tagsInMedia)
  if (valuesInMedia.length) valuesInMediaRepo.bulkCreate(valuesInMedia)

  const pinnedMeta: AnyRecord[] = []
  for (const c of obj.pinnedMeta) {
    const meta = metaIds.find((x) => x.oldId === c.metaId)
    if (!meta) continue

    for (const id of (c.pinnedMetaId as unknown[])) {
      const child = metaIds.find((x) => x.oldId === id)
      if (!child) continue

      pinnedMeta.push({
        metaId: meta.id,
        pinnedMetaId: child.id,
        scraper: null,
      })
    }
  }
  pinnedMetaRepo.bulkCreate(pinnedMeta)

  const tagsInTag: AnyRecord[] = []
  const valuesInTag: AnyRecord[] = []
  for (const card of obj.metaInTags) {
    for (const cardId in card) {
      const metaTag = tagsIds.find((x) => x.oldId === cardId)
      if (!metaTag) continue

      for (const key in (card as Record<string, Record<string, unknown>>)[cardId]) {
        const metaOfTag = metaIds.find((x) => x.oldId === key)
        if (!metaOfTag) continue

        const val = (card as Record<string, Record<string, unknown>>)[cardId][key]
        if (metaOfTag.type === 'array') {
          const tagOldIds = Array.isArray(val) ? val : []
          for (const tagOldId of tagOldIds) {
            const tag = tagsIds.find((x) => x.oldId === tagOldId)
            if (tag) {
              tagsInTag.push({
                parentTagId: metaTag.id,
                tagId: tag.id,
                metaId: metaOfTag.id,
              })
            }
          }
        } else if (val !== null && val !== '' && val !== 0 && val !== '0') {
          valuesInTag.push({
            value: String(val),
            metaId: metaOfTag.id,
            tagId: metaTag.id,
          })
        }
      }
    }
  }

  if (tagsInTag.length) tagsInTagRepo.bulkCreate(tagsInTag)
  if (valuesInTag.length) valuesInTagRepo.bulkCreate(valuesInTag)

  for (const folder of obj.watchedFolders) {
    const {folder: folderRow} = watchedFoldersRepo.findOrCreateByPath(
      String(folder.path ?? ''),
      folder.name,
    )
    watchedFoldersRepo.updateById(folderRow.id, {watch: folder.watch})
    mediaTypesInWatchedFoldersRepo.findOrCreate(folderRow.id, 1)
  }

  return {
    mediaIds,
    metaIds,
    tagsIds,
  }
}

module.exports = {
  importLowDbData,
}
