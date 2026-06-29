import type { MigrationContext } from '../types/sequelize'

module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    await queryInterface.sequelize.query(`
      DELETE FROM mediaTypes
      WHERE custom = 0
        AND id NOT IN (
          SELECT MIN(id)
          FROM mediaTypes
          WHERE custom = 0
          GROUP BY type
        )
    `)
  },

  async down() {
    // Data cleanup migration; duplicates should not be restored.
  },
}
