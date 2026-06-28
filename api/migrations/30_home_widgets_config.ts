import type { MigrationContext } from '../types/sequelize'
module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    const defaultConfig = JSON.stringify({
      order: [
        'stats',
        'extendedStats',
        'quickActions',
        'continue',
        'favorites',
        'topViews',
        'markers',
        'health',
        'topTags',
      ],
      enabled: {
        stats: true,
        extendedStats: true,
        quickActions: true,
        continue: true,
        favorites: true,
        topViews: true,
        markers: true,
        health: true,
        topTags: true,
      },
      limits: {
        continue: 12,
        favorites: 12,
        topViews: 12,
        markers: 8,
        topTags: 10,
      },
    })

    const escaped = defaultConfig.replace(/'/g, "''")
    const query = `INSERT INTO settings(option, value, createdAt, updatedAt)
                 VALUES ('home_widgets_config', '${escaped}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT(option) DO NOTHING`
    await queryInterface.sequelize.query(query)
  },

  async down({ context: queryInterface }: MigrationContext) {},
}
