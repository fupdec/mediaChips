import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const Media = sequelize.define(
    'media', {
      path: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      basename: {
        type: Sequelize.STRING,
      },
      name: {
        type: Sequelize.STRING,
      },
      ext: {
        type: Sequelize.STRING,
      },
      filesize: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      contentHash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      rating: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      favorite: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      bookmark: Sequelize.TEXT,
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      oldId: {
        type: Sequelize.TEXT,
        unique: true,
      },
      viewedAt: Sequelize.DATE,
    }
  )

  return Media;
};