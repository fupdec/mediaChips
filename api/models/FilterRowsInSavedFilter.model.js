module.exports = (sequelize, Sequelize) => {
  const FilterRowsInSavedFilter = sequelize.define('filterRowsInSavedFilter', null, {
    timestamps: false
  })

  return FilterRowsInSavedFilter;
};