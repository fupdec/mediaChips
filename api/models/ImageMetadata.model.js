module.exports = (sequelize, Sequelize) => {
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
