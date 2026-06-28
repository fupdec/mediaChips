module.exports = (sequelize, Sequelize) => {
  const Mark = sequelize.define(
    'mark', {
      type: Sequelize.TEXT,
      text: Sequelize.TEXT,
      time: Sequelize.INTEGER,
      end: Sequelize.INTEGER,
    }, {
      timestamps: false
    }
  )

  return Mark;
};