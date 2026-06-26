const path = require('path')
const fs = require('fs')
const {Umzug, SequelizeStorage} = require('umzug')

function setupDatabase({databasesPath, dbConfig}) {
  if (!dbConfig) {
    console.error('\x1b[31m%s\x1b[0m', '❌ No active database to connect to!')
    process.exit(1)
  }

  console.log('\x1b[36m%s\x1b[0m', `Connecting to database: ${dbConfig.name} (${dbConfig.id})`)

  const Sequelize = require('sequelize')
  const sqlite3 = require('../../api/utils/sqlite3-compat')
  const sequelize = new Sequelize({
    storage: path.join(databasesPath, dbConfig.id, 'db.sqlite'),
    dialect: 'sqlite',
    dialectModule: sqlite3,
    dialectOptions: {
      multipleStatements: true,
    },
    logging: false,
  })

  const db = require('../../api')(sequelize)
  db.config = dbConfig
  db.path_databases = databasesPath
  db.path = path.join(databasesPath, db.config.id)

  try {
    sequelize.authenticate()
    console.log('\x1b[36m%s\x1b[0m', '✅ Database connection successful')
    console.log('\x1b[36m%s\x1b[0m', `Database ID: ${db.config.id}`)
  } catch (e) {
    console.log('\x1b[31m%s\x1b[0m', '❌ Database connection error: ', e)
  }

  sequelize.sync().then(async () => {
    console.log('\x1b[36m%s\x1b[0m', '✅ Database synchronized')

    try {
      const migrations_folder = path.join(__dirname, '../../api/migrations/')
      if (fs.existsSync(migrations_folder)) {
        let migrations_list = fs.readdirSync(migrations_folder)
        migrations_list = migrations_list.sort().map(i => {
          const file_path = path.join(migrations_folder, i)
          const functions = require(file_path)
          return {...{name: i}, ...functions}
        })

        const umzug = new Umzug({
          migrations: migrations_list,
          context: sequelize.getQueryInterface(),
          storage: new SequelizeStorage({
            sequelize,
          }),
          logger: console,
        })

        await umzug.up()
        console.log('\x1b[32m%s\x1b[0m', '✅ Migrations applied')
      }

      await sequelize.query('PRAGMA journal_mode = WAL')
      await sequelize.query('PRAGMA synchronous = NORMAL')
      await sequelize.query('PRAGMA temp_store = MEMORY')
      await sequelize.query('PRAGMA cache_size = -64000')
    } catch (migrationError) {
      console.log('\x1b[33m%s\x1b[0m', '⚠️ Migration error:', migrationError.message)
    }
  }).catch(err => {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Database sync error:', err.message)
  })

  return {sequelize, db}
}

function warmupEmbeddingModel(db) {
  try {
    const embeddingModel = require('../../api/services/embeddingModel')
    embeddingModel.loadModel(db).catch(err => {
      console.log('\x1b[33m%s\x1b[0m', '⚠️ Parser model warmup skipped:', err.message)
    })
  } catch (err) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Parser model warmup unavailable:', err.message)
  }
}

module.exports = {
  setupDatabase,
  warmupEmbeddingModel,
}
