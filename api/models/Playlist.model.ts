import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const Playlist = sequelize.define('playlist', {
    name: Sequelize.TEXT, // название плейлиста
    favorite: { // избранный
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    oldId: Sequelize.TEXT, // старый id от предыдущей версии
  })

  return Playlist;
};