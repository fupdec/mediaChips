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
      ['mediaTypeId'],
      'media_media_type_id_idx',
    )
    await addIndexIfMissing(
      queryInterface,
      'tagsInMedia',
      ['mediaId'],
      'tags_in_media_media_id_idx',
    )
    await addIndexIfMissing(
      queryInterface,
      'tagsInMedia',
      ['tagId', 'metaId'],
      'tags_in_media_tag_meta_idx',
    )
    await addIndexIfMissing(
      queryInterface,
      'valuesInMedia',
      ['mediaId'],
      'values_in_media_media_id_idx',
    )
    await addIndexIfMissing(
      queryInterface,
      'valuesInMedia',
      ['metaId', 'mediaId'],
      'values_in_media_meta_media_idx',
    )
    await addIndexIfMissing(
      queryInterface,
      'mediaInPlaylists',
      ['playlistId'],
      'media_in_playlists_playlist_id_idx',
    )
    await addIndexIfMissing(
      queryInterface,
      'filterRowsInSavedFilters',
      ['filterId'],
      'filter_rows_in_saved_filter_filter_id_idx',
    )
    await addIndexIfMissing(
      queryInterface,
      'tagsInFilterRows',
      ['rowId'],
      'tags_in_filter_row_row_id_idx',
    )
  },

  async down({context: queryInterface}) {
    await removeIndexIfExists(queryInterface, 'tagsInFilterRows', 'tags_in_filter_row_row_id_idx')
    await removeIndexIfExists(
      queryInterface,
      'filterRowsInSavedFilters',
      'filter_rows_in_saved_filter_filter_id_idx',
    )
    await removeIndexIfExists(
      queryInterface,
      'mediaInPlaylists',
      'media_in_playlists_playlist_id_idx',
    )
    await removeIndexIfExists(
      queryInterface,
      'valuesInMedia',
      'values_in_media_meta_media_idx',
    )
    await removeIndexIfExists(
      queryInterface,
      'valuesInMedia',
      'values_in_media_media_id_idx',
    )
    await removeIndexIfExists(
      queryInterface,
      'tagsInMedia',
      'tags_in_media_tag_meta_idx',
    )
    await removeIndexIfExists(
      queryInterface,
      'tagsInMedia',
      'tags_in_media_media_id_idx',
    )
    await removeIndexIfExists(queryInterface, 'media', 'media_media_type_id_idx')
  },
}
