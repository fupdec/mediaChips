const path = require('path')
const fs = require('fs')
const {Umzug, SequelizeStorage} = require('umzug')
const {createMigrationSequelize} = require('./sequelizeSchema')
const {resetSqliteDatabase, runDrizzleMigrations} = require('./drizzleMigrations')

async function runUmzugMigrations(sequelize: import('sequelize').Sequelize) {
  const migrationsFolder = path.join(__dirname, '../migrations/')
  if (!fs.existsSync(migrationsFolder)) {
    return
  }

  const migrationsList = fs.readdirSync(migrationsFolder)
    .filter((fileName: string) => fileName.endsWith('.js'))
    .sort()
    .map((fileName: string) => {
      const filePath = path.join(migrationsFolder, fileName)
      const functions = require(filePath)
      return {...{name: fileName}, ...functions}
    })

  const umzug = new Umzug({
    migrations: migrationsList,
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({sequelize}),
    logger: console,
  })

  await umzug.up()
}

async function applyMigrationPragmas(sequelize: import('sequelize').Sequelize) {
  await sequelize.query('PRAGMA foreign_keys = ON')
  await sequelize.query('PRAGMA journal_mode = WAL')
  await sequelize.query('PRAGMA synchronous = NORMAL')
  await sequelize.query('PRAGMA temp_store = MEMORY')
  await sequelize.query('PRAGMA cache_size = -64000')
}

export async function bootstrapDatabase(dbPath: string) {
  runDrizzleMigrations(dbPath)

  const sequelize = createMigrationSequelize(dbPath)

  try {
    await sequelize.authenticate()
    await runUmzugMigrations(sequelize)
    await applyMigrationPragmas(sequelize)
  } finally {
    await sequelize.close()
  }
}

export async function resetDatabaseAndRunMigrations(dbPath: string) {
  resetSqliteDatabase(dbPath)
  runDrizzleMigrations(dbPath)

  const sequelize = createMigrationSequelize(dbPath)

  try {
    await runUmzugMigrations(sequelize)
    await applyMigrationPragmas(sequelize)
  } finally {
    await sequelize.close()
  }
}

module.exports = {
  bootstrapDatabase,
  resetDatabaseAndRunMigrations,
}
