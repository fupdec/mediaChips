module.exports = {
  async up({context: queryInterface}) {
    let query = `INSERT INTO settings(option, value, createdAt, updatedAt)
                 VALUES ('show_default_meta_filesize', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                        ('show_default_meta_duration', '0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                        ('show_default_meta_resolution', '0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                        ('show_default_meta_ext', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                        ('show_default_meta_codec', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                        ('show_default_meta_bitrate', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                        ('show_default_meta_fps', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                        ('show_default_meta_number_media', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                        ('show_default_meta_number_views', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT(option) DO UPDATE SET option=excluded.option`
    await queryInterface.sequelize.query(query);
  },

  async down({context: queryInterface}) {},
}