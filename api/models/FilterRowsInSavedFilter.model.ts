import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const FilterRowsInSavedFilter = sequelize.define('filterRowsInSavedFilter', {}, {
    timestamps: false
  })

  return FilterRowsInSavedFilter;
};