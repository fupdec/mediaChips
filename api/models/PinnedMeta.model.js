module.exports = (sequelize, Sequelize) => {
  const PinnedMeta = sequelize.define('pinnedMeta', {
    scraper: Sequelize.TEXT, // название ключа по которому скребок будет вставлять данные
    show: { // отображать ли на странице медиа
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    order: Sequelize.INTEGER, // в каком порядке отображать
  }, {
    timestamps: false
  })

  return PinnedMeta;
};