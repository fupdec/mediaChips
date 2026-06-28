import type { MigrationContext } from '../types/sequelize'
module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    const query = `INSERT INTO settings(option, value, createdAt, updatedAt)
                 VALUES
                   ('pathParser.useML', 'true', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                   ('pathParser.similarityThreshold', '0.75', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                   ('pathParser.folderWeight', '1.5', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                   ('pathParser.clusterThreshold', '0.88', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT(option) DO UPDATE SET option=excluded.option`
    await queryInterface.sequelize.query(query)
  },

  async down({ context: queryInterface }: MigrationContext) {},
}
