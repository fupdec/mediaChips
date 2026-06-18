module.exports = (sequelize, Sequelize) => {
  const ValuesInMedia = sequelize.define('valuesInMedia', {
    value: Sequelize.TEXT
  }, {
    timestamps: false
  })

  return ValuesInMedia;
};