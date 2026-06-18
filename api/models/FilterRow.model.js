module.exports = (sequelize, Sequelize) => {
  const FilterRow = sequelize.define(
    'filterRow', {
      param: Sequelize.TEXT,
      type: Sequelize.TEXT,
      cond: Sequelize.TEXT,
      val: Sequelize.TEXT,
      active: Sequelize.BOOLEAN,
      note: Sequelize.TEXT,
      lock: Sequelize.BOOLEAN,
      union: Sequelize.TEXT,
    }
  )

  return FilterRow;
};