module.exports = (sequelize, Sequelize) => {
  const MediaInPlaylists = sequelize.define('mediaInPlaylists', {
    order: Sequelize.INTEGER, // порядковый номер видео в плейлисте
  }, {
    timestamps: false
  })

  return MediaInPlaylists;
};