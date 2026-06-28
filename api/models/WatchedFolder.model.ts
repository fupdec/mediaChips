import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const WatchedFolder = sequelize.define(
    'watchedFolder', {
      path: Sequelize.TEXT,
      name: Sequelize.TEXT,
      watch: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
    }
  )

  return WatchedFolder;
};