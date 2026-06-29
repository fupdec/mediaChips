import type { ApiDb } from '../../api/types/db'
import type { ServerDatabaseEntry } from '../types/server'
import { apiErrorMessage, apiErrorStack } from '../../api/types/errors'
const path = require('path')
const fs = require('fs')
const {Umzug, SequelizeStorage} = require('umzug')

function setupDatabase({databasesPath, dbConfig}: { databasesPath: string; dbConfig: ServerDatabaseEntry | undefined }) {
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
  } catch (e: unknown) {
    console.log('\x1b[31m%s\x1b[0m', '❌ Database connection error: ', e)
  }

  sequelize.sync().then(async () => {
    console.log('\x1b[36m%s\x1b[0m', '✅ Database synchronized')

    try {
      const migrations_folder = path.join(__dirname, '../../api/migrations/')
      if (fs.existsSync(migrations_folder)) {
        let migrations_list = fs.readdirSync(migrations_folder)
          .filter((file: unknown) => typeof file === 'string' && file.endsWith('.js'))
        migrations_list = migrations_list.sort().map((i: unknown) => {
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
    } catch (migrationError: unknown) {
      console.log('\x1b[33m%s\x1b[0m', '⚠️ Migration error:', migrationError instanceof Error ? migrationError.message : String(migrationError))
    }
  }).catch((err: unknown) => {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Database sync error:', err instanceof Error ? apiErrorMessage(err) : String(err))
  })

  return {sequelize, db}
}

function warmupEmbeddingModel(db: ApiDb) {
  try {
    const embeddingModel = require('../../api/services/embeddingModel')
    embeddingModel.loadModel(db).catch((err: unknown) => {
      console.log('\x1b[33m%s\x1b[0m', '⚠️ Parser model warmup skipped:', err instanceof Error ? apiErrorMessage(err) : String(err))
    })
  } catch (err: unknown) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Parser model warmup unavailable:', err instanceof Error ? apiErrorMessage(err) : String(err))
  }
}

module.exports = {
  setupDatabase,
  warmupEmbeddingModel,
}
