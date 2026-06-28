import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const TagsInMedia = sequelize.define('tagsInMedia', {}, {
    timestamps: false
  })


  return TagsInMedia;
};