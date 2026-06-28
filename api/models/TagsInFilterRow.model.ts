import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const TagsInFilterRow = sequelize.define('tagsInFilterRow', {}, {
    timestamps: false
  })

  return TagsInFilterRow;
};