module.exports = {
  async up({context: queryInterface}) {
    const query = `INSERT INTO settings(option, value, createdAt, updatedAt)
                 VALUES
                   ('showPlaylistsInNavigation', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                   ('showMarkersInNavigation', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT(option) DO UPDATE SET option=excluded.option`
    await queryInterface.sequelize.query(query)
  },

  async down({context: queryInterface}) {},
}
