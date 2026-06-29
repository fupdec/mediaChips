import type { Express } from 'express'
import type { ServerConfig, ServerDatabaseEntry, NetworkIpInfo, ServerInitResult } from './types/server'
import { apiErrorMessage, apiErrorStack } from '../api/types/errors'
const {getBestLocalIp, getAllIps} = require('./server/network')
const {initializeServerConfig} = require('./server/serverConfig')
const {setupDatabase, warmupEmbeddingModel} = require('./server/database')
const {createExpressApp, setupStaticApp} = require('./server/createApp')
const {initAuthService} = require('./server/authRegistry')
const {createAuthMiddleware, registerAuthRoutes} = require('./server/auth')
const {registerApiRoutes} = require('./server/registerRoutes')
const {createFileResolver} = require('./server/fileResolver')
const {registerBuiltinRoutes} = require('./server/builtinRoutes')
const {createServerStarter} = require('./server/startup')
const {
  initLanAccess,
  registerServerNetworkDeps,
  syncNetworkConfig,
  isLanAccessEnabled,
} = require('./server/lanAccess')

const {config, configPath, databasesPath} = initializeServerConfig({
  getBestLocalIp,
  getAllIps,
})

const dbConfig = config.databases.find((i: ServerDatabaseEntry) => i.active)
const {db, drizzleConnection} = setupDatabase({databasesPath, dbConfig})
warmupEmbeddingModel(db)

const {createDatabaseManager} = require('./server/databaseManager')
const {initDatabaseManager} = require('./server/databaseRegistry')
const {getAuthService} = require('./server/authRegistry')

const {app, router} = createExpressApp()
const authService = initAuthService(db)
app.use(createAuthMiddleware(authService))
registerAuthRoutes(app, authService)

const routeLoadErrors = registerApiRoutes(app, db)

const {resolveFilePath, getStreamContentType} = createFileResolver({config, databasesPath})
const {createTranscodeManager} = require('../api/services/transcode/transcodeService')

const transcodeManager = createTranscodeManager({
  databasesPath,
  db,
  getActiveDbId: () => config.databases.find((entry: ServerDatabaseEntry) => entry.active)?.id || null,
})

const databaseManager = createDatabaseManager({
  db,
  config,
  configPath,
  databasesPath,
  transcodeManager,
  onDatabaseChanged: () => {
    try {
      getAuthService().invalidateSettingsCache()
    } catch {
      // auth service may not be initialized yet during startup
    }
  },
})
initDatabaseManager(databaseManager)

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
  transcodeManager,
})

setupStaticApp(app)

try {
  require('./tasks/websockets')(app, db)
} catch (err: unknown) {
  console.log('\x1b[33m%s\x1b[0m', '⚠️ WebSocket module not found:', err instanceof Error ? apiErrorMessage(err) : String(err))
}

const {startServer, restartNetworkListener, bindShutdownHandler, getListener} = createServerStarter({
  app,
  config,
  configPath,
  databasesPath,
})

async function bootstrapServer() {
  await initLanAccess(db, {getBestLocalIp, getAllIps})
  syncNetworkConfig(config, isLanAccessEnabled(), {getBestLocalIp, getAllIps})

  registerServerNetworkDeps({
    config,
    configPath,
    getBestLocalIp,
    getAllIps,
    restartListener: restartNetworkListener,
  })

  bindShutdownHandler()
  await startServer()
}

bootstrapServer().catch((err: unknown) => {
  console.error('Failed to start server:', err instanceof Error ? apiErrorMessage(err) : String(err))
  process.exit(1)
})

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
