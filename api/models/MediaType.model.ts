module.exports = (sequelize, Sequelize) => {
  const MediaType = sequelize.define(
    'mediaType', {
      name: Sequelize.TEXT,
      nameSingular: Sequelize.TEXT,
      icon: Sequelize.TEXT,
      extensions: Sequelize.TEXT,
      order: Sequelize.INTEGER,
      hidden: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      custom: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      type: Sequelize.TEXT,
    }
  )

  return MediaType;
};