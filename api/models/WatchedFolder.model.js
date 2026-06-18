module.exports = (sequelize, Sequelize) => {
  const WatchedFolder = sequelize.define(
    'watchedFolder', {
      path: Sequelize.TEXT,
      name: Sequelize.TEXT,
      watch: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
    }
  )

  return WatchedFolder;
};