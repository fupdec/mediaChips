import type { MigrationContext } from '../types/sequelize'
module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    let query = `INSERT INTO settings(option, value, createdAt, updatedAt)
                 VALUES ('system_dark_mode', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT(option) DO UPDATE SET option=excluded.option`
    await queryInterface.sequelize.query(query);
  },

  async down({ context: queryInterface }: MigrationContext) {},
}