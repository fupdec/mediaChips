module.exports = (sequelize, Sequelize) => {
  const ValuesInTag = sequelize.define('valuesInTag', {
    value: Sequelize.TEXT
  }, {
    timestamps: false
  })

  return ValuesInTag;
};