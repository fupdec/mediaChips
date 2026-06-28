module.exports = (sequelize, Sequelize) => {
  const Tab = sequelize.define(
    'tab', {
      name: Sequelize.TEXT,
      icon: Sequelize.TEXT,
      url: Sequelize.TEXT,
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
    }
  )

  return Tab;
};