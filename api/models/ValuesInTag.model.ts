import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const ValuesInTag = sequelize.define('valuesInTag', {
    value: Sequelize.TEXT
  }, {
    timestamps: false
  })

  return ValuesInTag;
};