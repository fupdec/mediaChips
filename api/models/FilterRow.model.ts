import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const FilterRow = sequelize.define(
    'filterRow', {
      param: Sequelize.TEXT,
      type: Sequelize.TEXT,
      cond: Sequelize.TEXT,
      val: Sequelize.TEXT,
      active: Sequelize.BOOLEAN,
      note: Sequelize.TEXT,
      lock: Sequelize.BOOLEAN,
      union: Sequelize.TEXT,
    }
  )

  return FilterRow;
};