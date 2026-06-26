const {getBestLocalIp, getAllIps} = require('./server/network')
const {initializeServerConfig} = require('./server/serverConfig')
const {setupDatabase, warmupEmbeddingModel} = require('./server/database')
const {createExpressApp, setupStaticApp} = require('./server/createApp')
const {registerApiRoutes} = require('./server/registerRoutes')
const {createFileResolver} = require('./server/fileResolver')
const {registerBuiltinRoutes} = require('./server/builtinRoutes')
const {createServerStarter} = require('./server/startup')

const {config, configPath, databasesPath} = initializeServerConfig({
  getBestLocalIp,
  getAllIps,
})

const dbConfig = config.databases.find(i => i.active)
const {db} = setupDatabase({databasesPath, dbConfig})
warmupEmbeddingModel(db)

const {app, router} = createExpressApp()
const routeLoadErrors = registerApiRoutes(app, db)

const {resolveFilePath, getStreamContentType} = createFileResolver({config, databasesPath})

registerBuiltinRoutes({
  app,
  router,
  config,
  configPath,
  databasesPath,
  db,
  routeLoadErrors,
  resolveFilePath,
  getStreamContentType,
})

setupStaticApp(app)

try {
  require('./tasks/websockets')(app, db)
} catch (err) {
  console.log('\x1b[33m%s\x1b[0m', '⚠️ WebSocket module not found:', err.message)
}

const {startServer, bindShutdownHandler, getListener} = createServerStarter({
  app,
  config,
  configPath,
  databasesPath,
})

bindShutdownHandler()
startServer()

global.serverConfig = config
global.serverApp = app

module.exports = {
  config,
  app,
  get listener() {
    return getListener()
  },
  resolveFilePath,
}
