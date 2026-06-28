import type { MigrationContext } from '../types/sequelize'
import type { AnyRecord } from '../types/db'
const path = require('path')
const {
  Sequelize
} = require('sequelize');
const _ = require('lodash')

module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    return queryInterface.describeTable('meta')
      .then(async (tableDefinition: AnyRecord) => {
        if (tableDefinition.chipVariant) {
          return Promise.resolve();
        } else {
          await Promise.all([
            queryInterface.addColumn(
              'meta',
              'chipVariant',
              {
                type: Sequelize.STRING,
                defaultValue: 'flat',
              },
            ),
          ]);

          let meta_settings = await (queryInterface.sequelize.models as any).meta.findAll({raw: true});

          let values = ''
          for (let i = 0; i < meta_settings.length; i++) {
            const j = meta_settings[i];
            values += `(${j.id},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'${j.chipOutlined == '1' ? 'outlined':'flat'}')`
            if (i !== meta_settings.length - 1) {
              values += ","
            }
          }

          let query = "INSERT INTO meta(id, createdAt, updatedAt, chipVariant)\n" +
            "VALUES " + values +
            " ON CONFLICT(id) DO UPDATE SET chipVariant=excluded.chipVariant \n" +
            "WHERE excluded.id = meta.id;"
          await queryInterface.sequelize.query(query);
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