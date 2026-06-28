import type { MigrationContext } from '../types/sequelize'
module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    const extensions = 'jpg,jpeg,bmp,png,webp,gif,tiff,tif,heic,avif,svg'

    await queryInterface.sequelize.query(`
      UPDATE mediaTypes
      SET hidden = 0,
          extensions = '${extensions}',
          updatedAt = CURRENT_TIMESTAMP
      WHERE type = 'image'
    `)
  },

  async down({ context: queryInterface }: MigrationContext) {
    await queryInterface.sequelize.query(`
      UPDATE mediaTypes
      SET hidden = 1,
          extensions = 'jpg,jpeg,bmp,png',
          updatedAt = CURRENT_TIMESTAMP
      WHERE type = 'image'
    `)
  },
}
