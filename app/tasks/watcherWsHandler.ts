import type { ApiDb } from '../../api/types/db'
import type {
  AppWebSocket,
  ExpressWithWs,
  WatchedFolderEntry,
  WatcherExtensionsMap,
  WatcherWsMessage,
  WsHandler,
} from '../types/websockets'
import { errorMessage } from '../types/websockets'
import type { Request } from 'express'
import chokidar from 'chokidar'
import { WatcherSyncEngine } from './watcherSync'
import {
  buildWatcherMasks,
  foldersConfigUnchanged,
  getWatcherFoldersConfigKey,
} from './wsHelpers'

export function createWatcherWsHandler(db: ApiDb): WsHandler {
  return (ws: AppWebSocket, _req: Request) => {
    let watcher: ReturnType<typeof chokidar.watch> | null = null
    let watchedFolders: WatchedFolderEntry[] = []
    const syncEngine = new WatcherSyncEngine(db)

    let isProcessing = false
    let pendingFullSync = false
    let pendingDbRefresh = false
    let pendingFileEvents: Array<{ event: 'add' | 'unlink'; path: string }> = []
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let lastFoldersConfigKey = ''

    const sendReports = () => {
      if (ws.readyState !== 1) {
        return
      }

      ws.send(JSON.stringify({
        type: 'files',
        data: syncEngine.getReports(),
      }))
    }

    const processPendingFileEvents = () => {
      if (!pendingFileEvents.length) {
        return false
      }

      const queuedEvents = pendingFileEvents
      pendingFileEvents = []

      let changed = false
      for (const fileEvent of queuedEvents) {
        changed = syncEngine.applyFileEvent(fileEvent.event, fileEvent.path) || changed
      }

      return changed
    }

    const runFullSync = async () => {
      if (!watcher) {
        return
      }

      if (isProcessing) {
        pendingFullSync = true
        return
      }

      isProcessing = true
      pendingFullSync = false

      try {
        await syncEngine.fullSync(watchedFolders)
        sendReports()
      } catch (error: unknown) {
        console.error('Error in watcher full sync:', errorMessage(error))
      } finally {
        isProcessing = false

        if (processPendingFileEvents()) {
          sendReports()
        }

        if (pendingFullSync) {
          pendingFullSync = false
          void runFullSync()
        } else if (pendingDbRefresh) {
          pendingDbRefresh = false
          void runDbRefresh()
        }
      }
    }

    const runDbRefresh = async () => {
      if (!watcher) {
        return
      }

      if (isProcessing) {
        pendingDbRefresh = true
        return
      }

      isProcessing = true

      try {
        syncEngine.setFolders(watchedFolders)
        await syncEngine.refreshDbPaths()
        sendReports()
      } catch (error: unknown) {
        console.error('Error in watcher db refresh:', errorMessage(error))
      } finally {
        isProcessing = false

        if (processPendingFileEvents()) {
          sendReports()
        }

        if (pendingFullSync) {
          pendingFullSync = false
          void runFullSync()
        } else if (pendingDbRefresh) {
          pendingDbRefresh = false
          void runDbRefresh()
        }
      }
    }

    const queueFileEvent = (event: 'add' | 'unlink', filePath: string) => {
      pendingFileEvents.push({event, path: filePath})

      if (isProcessing) {
        return
      }

      debouncedProcessFileEvents()
    }

    const processFileEvents = () => {
      if (isProcessing) {
        return
      }

      const changed = processPendingFileEvents()
      if (changed) {
        sendReports()
      }
    }

    const debouncedProcessFileEvents = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      debounceTimer = setTimeout(() => {
        processFileEvents()
      }, 500)
    }

    const startWatcher = (folders: WatchedFolderEntry[], extensions: WatcherExtensionsMap) => {
      if (watcher) {
        watcher.close()
        watcher = null
      }

      const foldersMasked = buildWatcherMasks(extensions)

      watcher = chokidar.watch(foldersMasked, {
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100,
        },
        ignored: /(^|[\/\\])\../,
        ignorePermissionErrors: true,
        depth: 99,
      })

      watcher
        .on('add', (filePath: string) => {
          queueFileEvent('add', filePath)
        })
        .on('unlink', (filePath: string) => {
          queueFileEvent('unlink', filePath)
        })
        .on('ready', async () => {
          await runFullSync()
        })
        .on('error', (error: unknown) => {
          console.error('Watcher error:', error)
        })
    }

    const updateWatcher = (folders: WatchedFolderEntry[], extensions: WatcherExtensionsMap) => {
      const nextConfigKey = getWatcherFoldersConfigKey(folders)
      const foldersUnchanged = foldersConfigUnchanged(lastFoldersConfigKey, folders)
      watchedFolders = folders
      lastFoldersConfigKey = nextConfigKey

      if (watcher && foldersUnchanged) {
        void runDbRefresh()
        return
      }

      if (watcher) {
        const foldersMasked = buildWatcherMasks(extensions)
        watcher.add(foldersMasked)

        setTimeout(() => {
          void runFullSync()
        }, 1000)
      } else {
        startWatcher(folders, extensions)
      }
    }

    ws.on('message', async (rawMsg: unknown) => {
      try {
        const data = JSON.parse(String(rawMsg)) as WatcherWsMessage

        switch (data.type) {
          case 'start':
            watchedFolders = data.folders || []
            lastFoldersConfigKey = getWatcherFoldersConfigKey(watchedFolders)
            startWatcher(watchedFolders, data.extensions || {})
            break

          case 'update':
            updateWatcher(data.folders || [], data.extensions || {})
            break

          case 'stop':
            if (watcher) {
              watcher.close()
              watcher = null
            }
            syncEngine.reset()
            pendingFileEvents = []
            lastFoldersConfigKey = ''
            if (ws.readyState === 1) {
              ws.send(JSON.stringify({type: 'closed'}))
            }
            break
        }
      } catch (error: unknown) {
        console.error('Error processing WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      if (watcher) {
        watcher.close()
      }
    })

    ws.on('error', (error: unknown) => {
      console.error('WebSocket error:', error)
    })
  }
}

export function registerWatcherWebSocket(wsApp: ExpressWithWs, db: ApiDb): void {
  wsApp.ws('/watcher', createWatcherWsHandler(db))
}
