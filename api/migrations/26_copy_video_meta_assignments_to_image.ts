import type { MigrationContext } from '../types/sequelize'
import type { AnyRecord } from '../types/db'
const {Sequelize} = require('sequelize')

module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    const tables = await queryInterface.showAllTables()
    if (!tables.includes('metaInMediaTypes')) {
      console.log('metaInMediaTypes table not found, skipping migration 26')
      return
    }

    const mediaTypes = await queryInterface.sequelize.query(
      `SELECT id, type FROM mediaTypes WHERE type IN ('video', 'image')`,
      {type: Sequelize.QueryTypes.SELECT},
    )

    const videoType = (mediaTypes as AnyRecord[]).find((row: AnyRecord) => row.type === 'video')
    const imageType = (mediaTypes as AnyRecord[]).find((row: AnyRecord) => row.type === 'image')

    if (!videoType || !imageType) {
      console.log('Video or image media type not found, skipping migration 26')
      return
    }

    const videoAssignments = await queryInterface.sequelize.query(
      `SELECT metaId, "order", scraper, show FROM metaInMediaTypes WHERE mediaTypeId = ?`,
      {
        replacements: [videoType.id],
        type: Sequelize.QueryTypes.SELECT,
      },
    )

    if (!videoAssignments.length) {
      console.log('No video meta assignments to copy, skipping migration 26')
      return
    }

    const tableColumns = await queryInterface.describeTable('metaInMediaTypes')
    const now = new Date()

    for (const row of videoAssignments as AnyRecord[]) {
      const record = {
        metaId: row.metaId,
        mediaTypeId: imageType.id,
        order: row.order,
        scraper: row.scraper,
        show: row.show ?? true,
        createdAt: now,
        updatedAt: now,
      }

      const filteredRecord: AnyRecord = {}
      for (const [key, value] of Object.entries(record)) {
        if (tableColumns[key] !== undefined) {
          filteredRecord[key] = value
        }
      }

      const fields = Object.keys(filteredRecord)
      const values = Object.values(filteredRecord)
      const escapedFields = fields.map((field: string) => {
        if (field.toLowerCase() === 'order') return `"${field}"`
        return field
      })
      const placeholders = fields.map(() => '?').join(', ')

      await queryInterface.sequelize.query(
        `INSERT INTO metaInMediaTypes (${escapedFields.join(', ')})
         SELECT ${placeholders}
         WHERE NOT EXISTS (
           SELECT 1 FROM metaInMediaTypes
           WHERE metaId = ? AND mediaTypeId = ?
         )`,
        {
          replacements: [...values, row.metaId, imageType.id],
          type: Sequelize.QueryTypes.INSERT,
        },
      )
    }

    console.log(
      `Copied ${videoAssignments.length} meta assignments from video (id=${videoType.id}) to image (id=${imageType.id})`,
    )
  },

  async down() {
    // Intentionally left empty: cannot reliably distinguish copied rows from user-created ones.
  },
}
