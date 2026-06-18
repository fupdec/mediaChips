module.exports = {
  async up({context: queryInterface}) {
    let query = `INSERT INTO settings(option, value, createdAt, updatedAt)
                 VALUES ('group_chips_in_card_description', '0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT(option) DO UPDATE SET option=excluded.option`
    await queryInterface.sequelize.query(query);
  },

  async down({context: queryInterface}) {},
}