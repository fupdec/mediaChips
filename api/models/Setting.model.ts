import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const Setting = sequelize.define(
    'setting', {
      option: {
        type: Sequelize.TEXT,
        unique: true
      },
      value: {
        type: Sequelize.TEXT,
      },
    }
  )

  return Setting;
};