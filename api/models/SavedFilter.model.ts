import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const SavedFilter = sequelize.define(
    'savedFilter', {
      name: Sequelize.TEXT,
    }
  )

  return SavedFilter;
};