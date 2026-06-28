const {
  Sequelize
} = require('sequelize');

module.exports = {
  async up({
             context: queryInterface
           }) {
    return queryInterface.describeTable('tabs')
      .then(async tableDefinition => {
        if (tableDefinition.order) {
          return Promise.resolve();
        } else {
          await Promise.all(
            [
              queryInterface.addColumn('tabs', 'order', {
                  type: Sequelize.INTEGER, defaultValue: 0,
                },
              ),
            ],
          );
        }
      })
      .catch((err) => console.log(err));
  },

  async down({
               context: queryInterface
             }) {
  },
}