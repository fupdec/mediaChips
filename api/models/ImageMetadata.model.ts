import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const ImageMetadata = sequelize.define(
    'imageMetadata', {
      width: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      height: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      orientation: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
    }, {
      name: {
        singular: 'imageMetadata',
        plural: 'imageMetadata',
      },
      timestamps: false,
    }
  )

  return ImageMetadata
}
