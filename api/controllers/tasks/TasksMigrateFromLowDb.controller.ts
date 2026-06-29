import type { ApiDb, AnyRecord } from '../../types/db'
import type {
  LowDbImportObject,
  LowDbTagsByMetaId,
  OldIdMapping,
  SettingOptionRow,
} from '../../types/migration'
import type { SequelizeInstance } from '../../types/db'
import type { ApiRequest, ApiResponse } from '../../types/http'
const fs = require("fs")

function asLegacyString(value: unknown): string {
  return String(value ?? '')
}

function asLegacyRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}
const fse = require("fs-extra")
const path = require('path')
const { rimraf } = require("rimraf")
const StreamZip = require('node-stream-zip')
const {Umzug, SequelizeStorage} = require("umzug");
const _ = require("lodash");
const { serializeCountries } = require('../../utils/country')

module.exports = function (db: ApiDb) {
  const dbPath = db.path
  const pathApp = process.app_folder
  let pathUserData;
  if (!pathApp) {
    pathUserData = path.join(__dirname, '../../../', 'userfiles')
  } else {
    pathUserData = path.join(pathApp, 'userfiles')
  }

  const rmrf = (folder: string) => rimraf(folder)

  // ДЛЯ ПОДДЕРЖКИ СТАРОЙ ВЕРСИИ ПРИЛОЖЕНИЯ (<= 0.11.3)
  const checkDataForMigrateFromLowDb = async (req: ApiRequest, res: ApiResponse) => {
    const pathSettings = path.join(pathUserData, 'dbs.json')
    const isSettingsExists = fs.existsSync(pathSettings)
    if (isSettingsExists) {
      res.sendStatus(201)
    } else {
      res.sendStatus(400)
    }
  }

  const cleanDataLowDb = async (req: ApiRequest, res: ApiResponse) => {
    try {
      await rmrf(pathUserData)
      console.log('\x1b[36m%s\x1b[0m', 'Old data was cleared successfully.', 'color: #bada55');
      res.status(201).send('deleted')
    } catch (err) {
      console.log(err)
      res.status(400).send(err)
    }
  }

  const createBackupLowDb = async (req: ApiRequest, res: ApiResponse) => {
    const currentdate = new Date(),
      date = currentdate.getDate(),
      month = currentdate.getMonth() + 1,
      hours = currentdate.getHours(),
      mins = currentdate.getMinutes(),
      secs = currentdate.getSeconds(),
      backupName = currentdate.getFullYear() + "." +
        (month > 9 ? month : '0' + month) + "." +
        (date > 9 ? date : '0' + date) + " " +
        (hours > 9 ? hours : '0' + hours) + "-" +
        (mins > 9 ? mins : '0' + mins) + "-" +
        (secs > 9 ? secs : '0' + secs),
      currentDB = path.join(pathUserData, "/databases/"),
      currentFiles = path.join(pathUserData, "/media/"),
      settings = path.join(pathUserData, "dbs.json");
    // console.log('found data from v0.11.3 or older')
    // console.log('backup creation started')
    const pathBackup = path.join(dbPath, "/backups/" + backupName + ".zip")
    const output = fs.createWriteStream(pathBackup);
    const archiver = require('archiver')
    const archive = archiver("zip");
    console.log('Archive initialized.')
    output.on("close", async () => {
      console.log('\x1b[36m%s\x1b[0m', 'archive had created successfully.', 'color: #bada55');
      if (req.body.is_copy_backups) {
        const pathBackupsOld = path.join(pathUserData, 'backups')
        const pathBackupsNew = path.join(dbPath, 'backups')

        if (fs.existsSync(pathUserData)) {
          try {
            fse.copySync(pathBackupsOld, pathBackupsNew, {overwrite: false})
            console.log('\x1b[36m%s\x1b[0m', 'Backups copied successfully.', 'color: #bada55');
          } catch (err) {
            console.error(err)
            res.status(400).send(err)
          }
        }
      }

      await rmrf(pathUserData)

      res.status(201).send(backupName)
    });
    archive.on("error", (err: unknown) => {
      console.error(err);
      res.status(400).send(err)
    });
    archive.pipe(output);
    archive.directory(currentDB, "databases");
    archive.directory(currentFiles, "media");
    archive.file(settings, {name: "dbs.json"});
    await archive.finalize();
  }

  // importing old database from JSON
  const migrateFromLowDb = async function (backupPath: string) {
    let tagsIds: OldIdMapping[] = []
    let metaIds: OldIdMapping[] = []
    let mediaIds: OldIdMapping[] = []

    const tempPath = path.join(dbPath, 'temp')
    if (fs.existsSync(tempPath)) {
      await rmrf(tempPath)
      fs.mkdirSync(tempPath)
    } else {
      fs.mkdirSync(tempPath)
    }

    const ext = path.extname(backupPath)
    if (!fs.existsSync(backupPath) || ext !== '.zip') {
      console.error('backup path does not exist')
      return "Invalid path or file does not exist"
    }

    const zip = new StreamZip.async({
      file: backupPath
    })

    await zip.extract(null, tempPath).catch((e: unknown) => {
      console.log(e)
      return e
    });
    await zip.close();
    console.log('\x1b[36m%s\x1b[0m', 'Archive with backup had extracted successfully.', 'color: #bada55');

    // очищаем папки с картинками новой БД
    const path_media_new = path.join(dbPath, 'media')
    const path_meta_new = path.join(dbPath, 'meta')
    await rmrf(path_media_new)
    await rmrf(path_meta_new)
    console.log('Current folders with media files had deleted.');

    // создаем заново все каталоги
    const createDefaultFoldersForDb = async () => {
      let userDirs: AnyRecord[] = []
      const mediaPath = path.join(dbPath, 'media')
      const metaPath = path.join(dbPath, 'meta')
      const backupsPath = path.join(dbPath, 'backups')
      const videoPath = path.join(mediaPath, 'videos')
      const imagePath = path.join(mediaPath, 'images')
      const audioPath = path.join(mediaPath, 'audios')
      const textPath = path.join(mediaPath, 'texts')
      let videoDirs = ['thumbs', 'marks', 'grids', 'timelines'].map((dirName: string) => (
        path.join(videoPath, dirName)
      ))
      userDirs = [...userDirs, ...[dbPath, mediaPath, metaPath, backupsPath]]
      userDirs = [...userDirs, ...[videoPath, imagePath, audioPath, textPath]]
      userDirs = [...userDirs, ...videoDirs]

      for (let i of userDirs) {
        if (!fs.existsSync(i))
          try {
            fs.mkdirSync(i)
          } catch (err) {
            console.log(err)
          }
      }
    }

    await createDefaultFoldersForDb();
    console.log('\x1b[36m%s\x1b[0m', 'Default folders of current database recreated.', 'color: #bada55');

    // move thumbs and meta images
    const thumbsOld = path.join(tempPath, 'media/thumbs')
    const thumbsNew = path.join(dbPath, 'media/videos/thumbs')
    const metaOld = path.join(tempPath, 'media/meta')
    const metaNew = path.join(dbPath, 'meta')

    function moveDir(from: string, to: string) {
      return new Promise<string>(async (resolve, reject) => {
        if (fs.existsSync(from)) {
          // удаление необходимо, чтобы при перемещении каталога не было ошибки
          try {
            await rmrf(to)
            // перемещаем каталог
            fs.renameSync(from, to)
            resolve("Successfully moved directory.")
          } catch (err) {
            console.log(err)
            reject(err)
          }
        }
      })
    }

    await moveDir(thumbsOld, thumbsNew);
    console.log('\x1b[36m%s\x1b[0m', 'Thumbs of videos moved successfully.', 'color: #bada55');
    await moveDir(metaOld, metaNew);
    console.log('\x1b[36m%s\x1b[0m', 'Images of tags moved successfully.', 'color: #bada55');

    function createImportObject(): Promise<LowDbImportObject> {
      return new Promise((resolve) => {
        const Videos = require(path.join(tempPath, 'databases', 'dbv.json'))
        const Playlists = require(path.join(tempPath, 'databases', 'dbpl.json'))
        const Marks = require(path.join(tempPath, 'databases', 'dbm.json'))
        const Meta = require(path.join(tempPath, 'databases', 'meta.json'))
        const Settings = require(path.join(tempPath, 'dbs.json'))

        let obj: LowDbImportObject = {
          meta: [],
          tags: [],
          videos: [],
          videoMetadata: [],
          playlists: [],
          marks: [],
          onlyMeta: [],
          metaInTags: [],
          pinnedMeta: [],
          settings: Settings,
          watchedFolders: []
        }
        obj.videos = Videos.videos.map((i: AnyRecord) => {
          const pathStr = asLegacyString(i.path)
          const baseName = pathStr ? (pathStr.split('\\').pop()?.split('/').pop() ?? '') : ''
          return {
            oldId: i.id,
            path: i.path,
            basename: baseName,
            name: baseName.replace(/\.[^/.]+$/, ''),
            ext: pathStr ? `.${pathStr.split('.').pop()}` : '',
            filesize: i.size,
            rating: i.rating || 0,
            favorite: i.favorite || false,
            bookmark: i.bookmark || null,
            views: i.views || 0,
            mediaTypeId: 1,
            createdAt: (new Date(asLegacyString(i.date)).toISOString()).replace('T', ' ').replace('Z', ' +00:00'),
            updatedAt: (new Date(asLegacyString(i.edit)).toISOString()).replace('T', ' ').replace('Z', ' +00:00'),
          }
        })
        obj.videoMetadata = Videos.videos.map((i: AnyRecord) => {
          const resolution = asLegacyString(i.resolution)
          return {
            oldId: i.id,
            duration: i.duration || 0,
            width: +(resolution.match(/\d*/)?.[0] || 0),
            height: +(resolution.match(/x(.*)/)?.[1] || 0),
          }
        })
        obj.playlists = Playlists.playlists.map((i: AnyRecord) => ({
          oldId: i.id,
          name: i.name,
          favorite: i.favorite || false,
          videos: i.videos || [],
          createdAt: (new Date(asLegacyString(i.date)).toISOString()).replace('T', ' ').replace('Z', ' +00:00'),
          updatedAt: (new Date(asLegacyString(i.edit)).toISOString()).replace('T', ' ').replace('Z', ' +00:00'),
        }))
        obj.marks = Marks.markers.map((i: AnyRecord) => {
          const markType = asLegacyString(i.type).toLowerCase()
          const isFavoriteOrBookmark = ['favorite', 'bookmark'].includes(markType)
          return {
            time: i.time,
            videoId: i.videoId,
            text: isFavoriteOrBookmark ? i.name : null,
            type: isFavoriteOrBookmark ? markType : 'meta',
            oldTagId: isFavoriteOrBookmark ? null : i.name,
          }
        })
        // get meta
        for (let m of Meta.meta) {
          if (m.type === 'specific') continue
          if (m.type === 'simple') {
            let sm = {
              oldId: m.id,
              type: m.dataType,
              name: m.settings.name,
              nameSingular: m.settings.name || null,
              icon: m.settings.icon || 'shape',
              hint: m.settings.hint || null,
              createdAt: (new Date(m.date).toISOString()).replace('T', ' ').replace('Z', ' +00:00'),
              updatedAt: (new Date(m.edit).toISOString()).replace('T', ' ').replace('Z', ' +00:00'),
              metaSetting: {
                ...{
                  "oldId": m.id,
                  "hidden": true,
                  "parser": false,
                  "imageAspectRatio": 1,
                  "imageTypes": "main",
                  "chipLabel": false,
                  "chipOutlined": false,
                  "color": false,
                  "favorite": true,
                  "rating": false,
                  "synonyms": false,
                  "bookmark": false,
                  "country": false,
                  "career": false,
                  "scraper": false,
                  "nested": false,
                  "marks": false,
                },
                ...m.settings
              },
              pageSetting: m.dataType == "array" ? {
                page: 1
              } : null,
            }
            obj.meta.push(sm)
            if (m.dataType === 'array') {
              let tags = m.settings.items.map((i: AnyRecord) => ({
                oldId: i.id,
                name: i.name,
              }))
              obj.tags.push({
                [String(m.id)]: tags
              })
            }
          } else if (m.type === 'complex') {
            let cm: AnyRecord = {
              oldId: m.id,
              type: 'array',
              name: m.settings.name,
              nameSingular: m.settings.nameSingular,
              icon: m.settings.icon || 'shape',
              hint: m.settings.hint || null,
              createdAt: (new Date(m.date).toISOString()).replace('T', ' ').replace('Z', ' +00:00'),
              updatedAt: (new Date(m.edit).toISOString()).replace('T', ' ').replace('Z', ' +00:00'),
            }
            let metaSettings = m.settings
            if (metaSettings.metaInCard) {
              obj.pinnedMeta.push({
                metaId: m.id,
                pinnedMetaId: metaSettings.metaInCard.map((i: AnyRecord) => i.id),
                scraperField: metaSettings.metaInCard.map((i: AnyRecord) => i.scraperField),
              })
            }
            delete metaSettings.metaInCard
            metaSettings.oldId = m.id
            metaSettings.marks = metaSettings.markers
            cm.metaSetting = metaSettings
            cm.pageSetting = {
              page: 1
            }
            obj.meta.push(cm)
            let cards = Meta.cards.filter((card: AnyRecord) => card.metaId == m.id).map((i: AnyRecord) => {
              const meta = asLegacyRecord(i.meta)
              const synonyms = meta.synonyms
              return {
                oldId: i.id,
                name: meta.name,
                synonyms: Array.isArray(synonyms) ? synonyms.join(', ') : null,
                rating: meta.rating || 0,
                favorite: meta.favorite || false,
                bookmark: meta.bookmark || null,
                country: serializeCountries(meta.country),
                color: meta.color || null,
                views: i.views || 0,
                createdAt: (new Date(asLegacyString(i.date)).toISOString()).replace('T', ' ').replace('Z', ' +00:00'),
                updatedAt: (new Date(asLegacyString(i.edit)).toISOString()).replace('T', ' ').replace('Z', ' +00:00'),
              }
            })
            for (let z of cards) {
              for (let y in z) {
                if (typeof z[y] == 'string' && z[y].length == 0) delete z[y]
                else if (z[y] === 0 || z[y] === '0') delete z[y]
                else if (z[y] === null) delete z[y]
              }
            }
              obj.tags.push({
                [String(m.id)]: cards
              })
            const metaKeys = ['name', 'synonyms', 'favorite', 'rating', 'bookmark', 'country', 'color']
            Meta.cards.filter((card: AnyRecord) => card.metaId == m.id).map((i: AnyRecord) => {
              const cardMeta = asLegacyRecord(i.meta)
              let metas = Object.fromEntries(Object.entries(cardMeta).filter(([key]) => !metaKeys.includes(key)))
              obj.metaInTags.push({
                [String(i.id)]: metas
              })
            })
          }
        }
        // get videos meta values and meta tags
        const videoKeys = ['path', 'duration', 'size', 'rating', 'favorite', 'date', 'resolution', 'edit', 'views', 'viewed', 'bookmark']
        obj.onlyMeta = Videos.videos.map((i: AnyRecord) =>
          Object.fromEntries(Object.entries(i).filter(([key]) => !videoKeys.includes(key)))
        )
        for (let z of obj.onlyMeta) {
          for (let y in z) {
            if (typeof z[y] == 'string' && z[y].length == 0) delete z[y]
            else if (z[y] === 0 || z[y] === '0') delete z[y]
            else if (z[y] === null) delete z[y]
          }
        }
        obj.watchedFolders = Settings.folders
        resolve(obj)
      })
    }

    console.log('Preparing object with data from previous version of app.');
    const obj: LowDbImportObject = await createImportObject()
    console.log('\x1b[36m%s\x1b[0m', 'Object prepared successfully.', 'color: #bada55');

    // очищаем таблицы новой БД
    await db.sequelize.sync({
      force: true
    }).then(async () => {
      console.log('Current data in tables was cleared');
      // migration system
      const migrations_folder = path.join(__dirname, '../../migrations/')
      let migrations_list = fs.readdirSync(migrations_folder)
        .filter((fileName: string) => fileName.endsWith('.js'))
      migrations_list = migrations_list.sort().map((fileName: string) => {
        let file_path = path.join(migrations_folder, fileName);
        let functions = require(file_path);
        return {...{name: fileName}, ...functions};
      });

      const umzug = new Umzug({
        migrations: migrations_list,
        context: db.sequelize.getQueryInterface(),
        storage: new SequelizeStorage({
          sequelize: db.sequelize
        }),
        // logger: console,
      });

      await umzug.up();
      console.log('\x1b[36m%s\x1b[0m', 'Migrations applied.', 'color: #bada55');
    })

    await db.Media.bulkCreate(obj.videos).then(async () => {
      mediaIds = await db.Media.findAll({
        attributes: ['id', 'oldId'],
        raw: true
      }) as unknown as OldIdMapping[]

      let videoMetadata: AnyRecord[] = []
      for (let video of obj.videoMetadata) {
        let media = mediaIds.find((x: OldIdMapping) => x.oldId === video.oldId)
        if (!media) continue
        else videoMetadata.push({
          ...{
            mediaId: media.id
          },
          ...video
        })
      }
      await db.VideoMetadata.bulkCreate(videoMetadata)
    }).then(async () => {
      const {loadDefaultSettingsList} = require('../../utils/defaultSettings')
      const settings = obj.settings

      const settingsList = loadDefaultSettingsList()
      let allowed = settingsList.map((i: SettingOptionRow) => i.option)

      const filteredOptions = Object.keys(settings)
        .filter((key: string) => allowed.includes(key))
        .reduce((obj: Record<string, unknown>, key: string) => {
          obj[key] = settings[key];
          return obj;
        }, {});

      let options: AnyRecord[] = []
      for (let option in filteredOptions) {
        let value = filteredOptions[option]
        options.push({
          option: option,
          value: value
        })
      }

      await db.Setting.bulkCreate(options, {
        updateOnDuplicate: ["value"]
      })
    }).then(async () => {
      // importing meta
      for (let m of obj.meta) {
        await db.Meta.create(m, {
          include: [db.MetaSetting, db.PageSetting]
        }).then(async (cm: SequelizeInstance) => {
          if (cm.type === 'array') {
            const [cf, isC] = await db.SavedFilter.findOrCreate({
              where: {
                name: null,
                metaId: cm.id
              }
            })

            if (isC) {
              await db.PageSetting.update({
                filterId: cf.id
              }, {
                where: {
                  metaId: cm.id
                }
              })
            }
          }
        }).catch((e: unknown) => {
          console.log(e)
        })
      }
      // getting all old ids for meta
      metaIds = await db.Meta.findAll({
        attributes: ['id', 'oldId', 'type'],
        raw: true
      }) as unknown as OldIdMapping[]

      for (let tags of obj.tags) {
        for (let i in tags) {
          const meta = metaIds.find((x: OldIdMapping) => x.oldId === i)
          if (!meta) continue

          let newTags = (tags as LowDbTagsByMetaId)[i].map((it: AnyRecord) => ({
            ...{
              metaId: meta.id
            },
            ...it
          }))
          await db.Tag.bulkCreate(newTags)
        }
      }

      tagsIds = await db.Tag.findAll({
        attributes: ['id', 'oldId'],
        raw: true
      }) as unknown as OldIdMapping[]
    }).then(async () => {
      for (let i of (obj.settings.metaAssignedToVideos as Array<{ id: unknown }>)) {
        const meta = metaIds.find((x: OldIdMapping) => x.oldId === i.id)
        if (!meta) continue
        await db.MetaInMediaType.create({
          mediaTypeId: 1,
          metaId: meta.id
        })
      }
    }).then(async () => {
      await db.Playlist.bulkCreate(obj.playlists)
    }).then(async () => {
      for (let playlist of obj.playlists) {
        const p = await db.Playlist.findOne({
          where: {
            oldId: playlist.oldId
          }
        })
        if (p === null) continue
        const playlistVideos = Array.isArray(playlist.videos) ? playlist.videos : []
        for (let i of playlistVideos) {
          let media = mediaIds.find((x: OldIdMapping) => x.oldId === i)
          if (!media) continue
          else await db.MediaInPlaylists.create({
            playlistId: p.id,
            mediaId: media.id,
            order: playlistVideos.indexOf(i),
          })
        }
      }
    }).then(async () => {
      let marks: AnyRecord[] = []
      for (let mark of obj.marks) {
        let found = mediaIds.find((x: OldIdMapping) => x.oldId === mark.videoId)
        if (!found) continue
        mark.mediaId = found.id
        if (mark.type === 'favorite' && mark.text === '') mark.text = null
        else if (mark.type === 'meta') {
          let foundTag = tagsIds.find((x: OldIdMapping) => x.oldId === mark.oldTagId)
          if (!foundTag) continue
          else mark.tagId = foundTag.id
        }
        marks.push(mark)
      }
      await db.Mark.bulkCreate(marks)
    }).then(async () => { // meta in videos
      let tagsInMedia: AnyRecord[] = []
      let valuesInMedia: AnyRecord[] = []
      for (let videoMeta of obj.onlyMeta) {
        let mVideo = mediaIds.find((x: OldIdMapping) => x.oldId === videoMeta.id)
        if (!mVideo) continue

        let onlyMetaFields = Object.fromEntries(Object.entries(videoMeta).filter(([key]) => !key.includes('id')))
        for (let fieldName in onlyMetaFields) {
          let m = metaIds.find((x: OldIdMapping) => x.oldId === fieldName)
          if (!m) continue
          else {
            let val = onlyMetaFields[fieldName]
            if (m.type === 'array') {
              for (let tag of val as Array<string | number>) {
                let metaTag = tagsIds.find((x: OldIdMapping) => x.oldId === tag)
                if (!metaTag) continue
                else {
                  tagsInMedia.push({
                    metaId: m.id,
                    mediaId: mVideo.id,
                    tagId: metaTag.id
                  })
                }
              }
            } else if (val !== null && val !== '' && val !== 0 && val !== '0') {
              valuesInMedia.push({
                value: val,
                metaId: m.id,
                mediaId: mVideo.id,
              })
            }
          }
        }
      }
      await db.TagsInMedia.bulkCreate(tagsInMedia)
      await db.ValuesInMedia.bulkCreate(valuesInMedia)
    }).then(async () => {
      let pinnedMeta: AnyRecord[] = []
      let cm = obj.pinnedMeta
      for (let c of cm) {
        let meta = metaIds.find((x: OldIdMapping) => x.oldId === c.metaId)
        if (!meta) continue

        for (let id of (c.pinnedMetaId as unknown[])) {
          let child = metaIds.find((x: OldIdMapping) => x.oldId === id)
          if (!child) continue

          pinnedMeta.push({
            metaId: meta.id,
            pinnedMetaId: child.id,
            scraperField: null,
          })
        }
      }

      await db.PinnedMeta.bulkCreate(pinnedMeta)
    }).then(async () => { // tags in meta tags
      let tagsInTag: AnyRecord[] = []
      let valuesInTag: AnyRecord[] = []
      for (let card of obj.metaInTags) {
        for (let cardId in card) {
          let metaTag = tagsIds.find((x: OldIdMapping) => x.oldId === cardId)
          if (!metaTag) continue

          for (let key in (card as Record<string, Record<string, unknown>>)[cardId]) {
            let metaOfTag = metaIds.find((x: OldIdMapping) => x.oldId === key)
            if (!metaOfTag) continue

            let val = (card as Record<string, Record<string, unknown>>)[cardId][key]
            if (metaOfTag.type === 'array') {
              const tagOldIds = Array.isArray(val) ? val : []
              for (let tagOldId of tagOldIds) {
                let tag = tagsIds.find((x: OldIdMapping) => x.oldId === tagOldId)
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
                value: val,
                metaId: metaOfTag.id,
                tagId: metaTag.id
              })
            }
          }
        }
      }
      await db.TagsInTag.bulkCreate(tagsInTag)
      await db.ValuesInTag.bulkCreate(valuesInTag)
    }).then(async () => { // watched Folders
      for (let folder of obj.watchedFolders) {
        const [folderRow] = await db.WatchedFolder.findOrCreate({
          where: {
            path: folder.path,
          },
          defaults: {
            name: folder.name,
            watch: folder.watch,
          },
        })
        await db.MediaTypesInWatchedFolders.findOrCreate({
          where: {
            folderId: folderRow.id,
            mediaTypeId: 1
          }
        })
      }
    }).then(() => {
      for (let id of metaIds) { // creating folders for meta images
        let folderMetaOldId = path.join(metaNew, id.oldId)
        let folderMetaNewId = path.join(metaNew, `${id.id}`)

        if (fs.existsSync(folderMetaOldId))
          fs.renameSync(folderMetaOldId, folderMetaNewId)
      }
    }).then(() => {
      console.log('\x1b[36m%s\x1b[0m', 'Object with data had imported into database.', 'color: #bada55');

      let tree: string[] = []

      function mapDir(dir: string) {
        fs.readdirSync(dir).forEach((file: string) => {
          const abs = path.join(dir, file);
          if (fs.statSync(abs).isDirectory()) return mapDir(abs);
          else return tree.push(abs);
        });
      }

      mapDir(metaNew)

      function replaceMetaId(name: string) {
        const types = ["_main", "_alt", "_custom1", "_custom2", "_avatar", "_header"]
        for (let type of types) {
          if (!name.includes(type)) continue
          let oldId = name.replace(type, '')
          let found = tagsIds.find((x: OldIdMapping) => x.oldId === oldId)
          if (!found) continue
          name = found.id + type
          break
        }
        return name
      }

      for (let imgPath of tree) { // renaming meta images
        // getting image name with type from path e.g. _main, _alt, _custom1
        let nameOld = path.basename(imgPath, path.extname(imgPath))
        // finding new id of meta
        let nameNew = replaceMetaId(nameOld)
        let newPath = imgPath.replace(nameOld, nameNew)
        if (fs.existsSync(imgPath)) fs.renameSync(imgPath, newPath)
      }

      // составляем массив с путями файлов для будущего переименования
      mapDir(thumbsNew)
      console.log('Renaming media files...');

      function replaceMediaId(name: string) {
        let found = mediaIds.find((x: OldIdMapping) => x.oldId === name)
        if (found) return found.id
        else return name
      }

      for (let imgPath of tree) { // renaming media images
        let nameOld = path.basename(imgPath, path.extname(imgPath))
        let nameNew = String(replaceMediaId(nameOld))
        let newPath = imgPath.replace(nameOld, nameNew)
        if (fs.existsSync(imgPath)) fs.renameSync(imgPath, newPath)
      }
      console.log('\x1b[36m%s\x1b[0m', 'Media files had renamed successfully.', 'color: #bada55');

      rmrf(tempPath)
      console.log('Removing temp data...');
      console.log('\x1b[36m%s\x1b[0m', 'All data has been successfully imported.', 'color: #bada55');

      return "All data has been successfully imported."
    }).catch((e: unknown) => {
      console.log(e)
      return e
    })
  };

  return {
    checkDataForMigrateFromLowDb,
    cleanDataLowDb,
    createBackupLowDb,
    migrateFromLowDb,
  }
}