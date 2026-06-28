import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const ValuesInMedia = sequelize.define('valuesInMedia', {
    value: Sequelize.TEXT
  }, {
    timestamps: false
  })

  return ValuesInMedia;
};