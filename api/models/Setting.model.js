module.exports = (sequelize, Sequelize) => {
  const Setting = sequelize.define(
    'setting', {
      option: {
        type: Sequelize.TEXT,
        unique: true
      },
      value: {
        type: Sequelize.TEXT,
      },
    }
  )

  return Setting;
};