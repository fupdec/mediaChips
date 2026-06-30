import type { ApiDb } from '../../api/types/db'
import type { Express } from 'express'
import expressWs from 'express-ws'
import { registerMovingWebSocket } from './movingWsHandler'
import { registerWatcherWebSocket } from './watcherWsHandler'
import type { ExpressWithWs } from '../types/websockets'

function registerWebSockets(app: Express, db: ApiDb) {
  expressWs(app)
  const wsApp = app as ExpressWithWs

  registerWatcherWebSocket(wsApp, db)
  registerMovingWebSocket(wsApp, db)
}

export default registerWebSockets
