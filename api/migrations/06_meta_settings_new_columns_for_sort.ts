import type { MigrationContext } from '../types/sequelize'
import type { AnyRecord } from '../types/db'
const {
  Sequelize
} = require('sequelize');

module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    return queryInterface.describeTable('metaSettings')
      .then(async (tableDefinition: AnyRecord) => {
        if (tableDefinition.sortBy) {
          return Promise.resolve();
        } else {
          await Promise.all([queryInterface.addColumn('metaSettings', 'sortBy', {
            type: Sequelize.STRING, defaultValue: 'createdAt',
          },), queryInterface.addColumn('metaSettings', 'sortDir', {
            type: Sequelize.STRING, defaultValue: 'asc',
          },),]);
        }
      }).catch((err) => console.log(err));
  },

  async down({ context: queryInterface }: MigrationContext) {
    // return Promise.all([
    //   queryInterface.removeColumn('media', 'name'),
    //   queryInterface.removeColumn('media', 'basename'),
    //   queryInterface.removeColumn('media', 'ext'),
    // ]);
  },
}