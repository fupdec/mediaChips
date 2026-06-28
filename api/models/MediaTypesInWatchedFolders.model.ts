import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const MediaTypesInWatchedFolders = sequelize.define('mediaTypesInWatchedFolders', {}, {
    timestamps: false
  })

  return MediaTypesInWatchedFolders;
};