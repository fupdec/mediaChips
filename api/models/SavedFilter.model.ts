module.exports = (sequelize, Sequelize) => {
  const SavedFilter = sequelize.define(
    'savedFilter', {
      name: Sequelize.TEXT,
    }
  )

  return SavedFilter;
};