import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const Tag = sequelize.define(
    'tag', {
      oldId: {
        type: Sequelize.TEXT,
        unique: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      synonyms: Sequelize.TEXT,
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      favorite: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      bookmark: Sequelize.TEXT,
      country: Sequelize.TEXT,
      color: Sequelize.TEXT,
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      viewedAt: Sequelize.DATE,
    }
  )

  return Tag;
};