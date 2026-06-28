const path = require('path')
const {
  Sequelize
} = require('sequelize');
const _ = require('lodash')

module.exports = {
  async up({
             context: queryInterface
           }) {
    return queryInterface.describeTable('media')
      .then(async tableDefinition => {
        if (tableDefinition.name) {
          return Promise.resolve();
        } else {
          await Promise.all([
            queryInterface.addColumn(
              'media',
              'name',
              {
                type: Sequelize.STRING
              }
            ),
            queryInterface.addColumn(
              'media',
              'ext',
              {
                type: Sequelize.STRING
              }
            ),
            queryInterface.addColumn(
              'media',
              'basename',
              {
                type: Sequelize.STRING
              }
            ),
          ]);

          let media_all = await queryInterface.sequelize.models.media.findAll({raw: true});

          let media_modified = media_all.map(i => {
            let j: Record<string, any> = {}
            let filepath = i.path;
            filepath = _.replace(filepath, /'/g, "''")
            filepath = _.replace(filepath, /`/g, "``")
            j.path = filepath;
            j.ext = path.extname(filepath);
            j.basename = path.basename(filepath);
            j.name = path.parse(filepath).name;
            return {...i, ...j};
          });

          let values = ''
          for (let i = 0; i < media_modified.length; i++) {
            const j = media_modified[i];
            values += `(${j.id}, '${j.path}', '${j.createdAt}', '${j.updatedAt}', '${j.name}', '${j.ext}', '${j.basename}')`
            if (i !== media_modified.length - 1) {
              values += ","
            }
          }

          let query = "INSERT INTO media(id, path, createdAt, updatedAt, name, ext, basename)\n" +
            "VALUES " + values +
            " ON CONFLICT(id) DO UPDATE SET name=excluded.name,\n" +
            "                              ext=excluded.ext,\n" +
            "                              basename=excluded.basename\n" +
            "WHERE excluded.id = media.id;"
          await queryInterface.sequelize.query(query);
        }
      }).catch((err) => console.log(err));
  },

  async down({
               context: queryInterface
             }) {
    // return Promise.all([
    //   queryInterface.removeColumn('media', 'name'),
    //   queryInterface.removeColumn('media', 'basename'),
    //   queryInterface.removeColumn('media', 'ext'),
    // ]);
  },
}