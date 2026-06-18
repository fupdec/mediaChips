module.exports = {
  async up({context: queryInterface}) {
    let query = `INSERT INTO settings(option, value, createdAt, updatedAt)
                 VALUES ('show_preset_metadata_in_card', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT(option) DO UPDATE SET option=excluded.option`
    await queryInterface.sequelize.query(query);
  },

  async down({context: queryInterface}) {},
}