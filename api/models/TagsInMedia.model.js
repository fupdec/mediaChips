module.exports = (sequelize, Sequelize) => {
  const TagsInMedia = sequelize.define('tagsInMedia', null, {
    timestamps: false
  })


  return TagsInMedia;
};