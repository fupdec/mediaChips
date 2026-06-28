import type { MigrationContext } from '../types/sequelize'
module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    let query = `INSERT INTO settings(option, value, createdAt, updatedAt)
                 VALUES ('show_salutation', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                        ('show_ip_at_home_screen', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT(option) DO UPDATE SET option=excluded.option`
    await queryInterface.sequelize.query(query);
  },

  async down({ context: queryInterface }: MigrationContext) {},
}