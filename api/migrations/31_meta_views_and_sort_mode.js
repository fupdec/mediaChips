const {Sequelize} = require('sequelize')

module.exports = {
  async up({context: queryInterface}) {
    const tableDefinition = await queryInterface.describeTable('meta')

    if (!tableDefinition.views) {
      await queryInterface.addColumn('meta', 'views', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      })
    }

    const query = `INSERT INTO settings(option, value, createdAt, updatedAt)
                 VALUES ('meta_sort_mode', 'menu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT(option) DO NOTHING`
    await queryInterface.sequelize.query(query)
  },

  async down({context: queryInterface}) {},
}
