const {Sequelize} = require('sequelize')

module.exports = {
  async up({context: queryInterface}) {
    const tableDefinition = await queryInterface.describeTable('media')

    if (!tableDefinition.contentHash) {
      await queryInterface.addColumn('media', 'contentHash', {
        type: Sequelize.STRING(64),
        allowNull: true,
      })
    }

    const indexes = await queryInterface.showIndex('media')
    const hasContentHashIndex = indexes.some(
      (index) => index.name === 'media_content_hash_idx',
    )

    if (!hasContentHashIndex) {
      await queryInterface.addIndex('media', ['contentHash'], {
        name: 'media_content_hash_idx',
      })
    }
  },

  async down({context: queryInterface}) {
    const indexes = await queryInterface.showIndex('media')
    const hasContentHashIndex = indexes.some(
      (index) => index.name === 'media_content_hash_idx',
    )

    if (hasContentHashIndex) {
      await queryInterface.removeIndex('media', 'media_content_hash_idx')
    }

    const tableDefinition = await queryInterface.describeTable('media')
    if (tableDefinition.contentHash) {
      await queryInterface.removeColumn('media', 'contentHash')
    }
  },
}
