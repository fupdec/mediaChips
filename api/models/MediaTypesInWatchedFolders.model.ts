module.exports = (sequelize, Sequelize) => {
  const MediaTypesInWatchedFolders = sequelize.define('mediaTypesInWatchedFolders', null, {
    timestamps: false
  })

  return MediaTypesInWatchedFolders;
};