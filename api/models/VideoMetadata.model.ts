module.exports = (sequelize, Sequelize) => {
  const VideoMetadata = sequelize.define(
    'videoMetadata', {
      duration: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      width: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      height: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      bitrate: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      fps: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      time: Sequelize.INTEGER,
      codec: Sequelize.TEXT,
    }, {
      name: {
        singular: 'videoMetadata',
        plural: 'videoMetadata',
      },
      timestamps: false
    }
  )

  return VideoMetadata;
};