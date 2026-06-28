import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const TagsInTag = sequelize.define('tagsInTag', {}, {
    timestamps: false
  })

  return TagsInTag;
};