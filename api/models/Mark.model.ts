import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const Mark = sequelize.define(
    'mark', {
      type: Sequelize.TEXT,
      text: Sequelize.TEXT,
      time: Sequelize.INTEGER,
      end: Sequelize.INTEGER,
    }, {
      timestamps: false
    }
  )

  return Mark;
};