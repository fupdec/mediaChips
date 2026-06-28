import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const MediaInPlaylists = sequelize.define('mediaInPlaylists', {
    order: Sequelize.INTEGER, // порядковый номер видео в плейлисте
  }, {
    timestamps: false
  })

  return MediaInPlaylists;
};