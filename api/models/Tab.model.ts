import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const Tab = sequelize.define(
    'tab', {
      name: Sequelize.TEXT,
      icon: Sequelize.TEXT,
      url: Sequelize.TEXT,
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
    }
  )

  return Tab;
};