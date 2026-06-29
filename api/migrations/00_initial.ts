import type { MigrationContext } from '../types/sequelize'
import type { AnyRecord } from '../types/db'
// const {
// 	Sequelize
// } = require('sequelize');
const {loadDefaultSettingsList} = require('../utils/defaultSettings')

module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    const { Sequelize } = require('sequelize')

    const existingMediaTypes = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM mediaTypes WHERE custom = 0`,
      { type: Sequelize.QueryTypes.SELECT },
    )
    const mediaTypeCount = Number((existingMediaTypes as AnyRecord[])[0]?.count ?? 0)

    if (mediaTypeCount === 0) {
      await queryInterface.bulkInsert('mediaTypes',
        [{
          type: 'video',
          name: 'Videos',
          nameSingular: 'Video',
          icon: 'video-outline',
          extensions: 'avi,3gp,f4v,flv,m4v,mkv,mod,mov,mp4,mpeg,mpg,mts,rm,rmvb,swf,ts,vob,webm,wmv,yuv',
          custom: false,
          hidden: false,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }, {
          type: 'image',
          name: 'Images',
          nameSingular: 'Image',
          icon: 'image-outline',
          extensions: 'jpg,jpeg,bmp,png',
          custom: false,
          hidden: true,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        }, {
          type: 'audio',
          name: 'Audios',
          nameSingular: 'Audio',
          icon: 'music',
          extensions: 'mp3,m4a,wav,flac',
          custom: false,
          hidden: true,
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        }, {
          type: 'text',
          name: 'Texts',
          nameSingular: 'Text',
          icon: 'sticker-text-outline',
          extensions: 'txt,doc,pdf,html',
          custom: false,
          hidden: true,
          order: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        },]
      )
    }

    const existingSettings = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM settings`,
      { type: Sequelize.QueryTypes.SELECT },
    )
    const settingsCount = Number((existingSettings as AnyRecord[])[0]?.count ?? 0)

    if (settingsCount === 0) {
      const settingsList = loadDefaultSettingsList()

      const sets = settingsList.map((i: AnyRecord) => ({
        option: i.option,
        value: i.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      await queryInterface.bulkInsert('settings', sets)
    }
  },

  async down({ context: queryInterface }: MigrationContext) {
    // await queryInterface.dropTable('settings');
    // await queryInterface.dropTable('media');
  },
};