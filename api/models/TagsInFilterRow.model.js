module.exports = (sequelize, Sequelize) => {
  const TagsInFilterRow = sequelize.define('tagsInFilterRow', null, {
    timestamps: false
  })

  return TagsInFilterRow;
};