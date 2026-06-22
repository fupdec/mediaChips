async function addIndexIfMissing(queryInterface, table, fields, name) {
  const indexes = await queryInterface.showIndex(table)
  if (!indexes.some((index) => index.name === name)) {
    await queryInterface.addIndex(table, fields, {name})
  }
}

async function removeIndexIfExists(queryInterface, table, name) {
  const indexes = await queryInterface.showIndex(table)
  if (indexes.some((index) => index.name === name)) {
    await queryInterface.removeIndex(table, name)
  }
}

module.exports = {
  async up({context: queryInterface}) {
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

  async down({context: queryInterface}) {
    await removeIndexIfExists(queryInterface, 'media', 'media_media_type_id_rating_idx')
    await removeIndexIfExists(queryInterface, 'media', 'media_media_type_id_updated_at_idx')
    await removeIndexIfExists(queryInterface, 'media', 'media_media_type_id_created_at_idx')
    await removeIndexIfExists(queryInterface, 'media', 'media_media_type_id_id_idx')
  },
}
