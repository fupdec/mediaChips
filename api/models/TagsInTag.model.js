module.exports = (sequelize, Sequelize) => {
  const TagsInTag = sequelize.define('tagsInTag', null, {
    timestamps: false
  })

  return TagsInTag;
};