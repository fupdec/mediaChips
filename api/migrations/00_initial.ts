import type { MigrationContext } from '../types/sequelize'
import type { AnyRecord } from '../types/db'
// const {
// 	Sequelize
// } = require('sequelize');
const {loadDefaultSettingsList} = require('../utils/defaultSettings')

module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
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
    );
    const settingsList = loadDefaultSettingsList()

    let sets = settingsList.map((i: AnyRecord) => ({
      option: i.option,
      value: i.value,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    await queryInterface.bulkInsert('settings', sets);
  },

  async down({ context: queryInterface }: MigrationContext) {
    // await queryInterface.dropTable('settings');
    // await queryInterface.dropTable('media');
  },
};