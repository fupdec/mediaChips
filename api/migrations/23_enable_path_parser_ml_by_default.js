module.exports = {
  async up({context: queryInterface}) {
    const query = `UPDATE settings
                 SET value = 'true', updatedAt = CURRENT_TIMESTAMP
                 WHERE option = 'pathParser.useML'`
    await queryInterface.sequelize.query(query)
  },

  async down({context: queryInterface}) {},
}
