import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const PageSetting = sequelize.define(
    'pageSetting', {
      page: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      size: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
      },
      view: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      limit: {
        type: Sequelize.INTEGER,
        defaultValue: 101,
      },
      sortBy: {
        type: Sequelize.TEXT,
        defaultValue: 'createdAt',
      },
      sortDir: {
        type: Sequelize.TEXT,
        defaultValue: 'asc',
      },
      firstChar: Sequelize.TEXT,
      colors: Sequelize.TEXT,
    }, {
      timestamps: false
    }
  )

  return PageSetting;
};