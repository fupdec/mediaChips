module.exports = (sequelize, Sequelize) => {
  const MetaInMediaType = sequelize.define('metaInMediaType', {
    scraper: Sequelize.TEXT, // название ключа по которому скребок будет вставлять данные
    show: { // отображать ли на странице медиа
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    order: Sequelize.INTEGER, // в каком порядке отображать
  }, {
    timestamps: false
  })

  return MetaInMediaType;
};