import type { MigrationContext } from '../types/sequelize'
import type { AnyRecord } from '../types/db'
import type { SequelizeQueryInterface } from '../types/db'
async function addIndexIfMissing(queryInterface: SequelizeQueryInterface, table: string, fields: unknown, name: string) {
  const indexes = await queryInterface.showIndex(table)
  if (!indexes.some((index: AnyRecord) => index.name === name)) {
    await queryInterface.addIndex(table, fields, {name})
  }
}

async function removeIndexIfExists(queryInterface: SequelizeQueryInterface, table: string, name: string) {
  const indexes = await queryInterface.showIndex(table)
  if (indexes.some((index: AnyRecord) => index.name === name)) {
    await queryInterface.removeIndex(table, name)
  }
}

module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    await addIndexIfMissing(
      queryInterface,
      'media',
      ['mediaTypeId', 'id'],
      'media_media_type_id_id_idx',
    )
    await addIndexIfMissing(
      queryInterface,
      'media',
      ['mediaTypeId', 'createdAt'],
      'media_media_type_id_created_at_idx',
    )
    await addIndexIfMissing(
      queryInterface,
      'media',
      ['mediaTypeId', 'updatedAt'],
      'media_media_type_id_updated_at_idx',
    )
    await addIndexIfMissing(
      queryInterface,
      'media',
      ['mediaTypeId', 'rating'],
      'media_media_type_id_rating_idx',
    )
  },

  async down({ context: queryInterface }: MigrationContext) {
    await removeIndexIfExists(queryInterface, 'media', 'media_media_type_id_rating_idx')
    await removeIndexIfExists(queryInterface, 'media', 'media_media_type_id_updated_at_idx')
    await removeIndexIfExists(queryInterface, 'media', 'media_media_type_id_created_at_idx')
    await removeIndexIfExists(queryInterface, 'media', 'media_media_type_id_id_idx')
  },
}
