import type { MigrationContext } from '../types/sequelize'
import type { AnyRecord } from '../types/db'
const {
  Sequelize
} = require('sequelize');

module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    return queryInterface.describeTable('tabs')
      .then(async (tableDefinition: AnyRecord) => {
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

  async down({ context: queryInterface }: MigrationContext) {
  },
}