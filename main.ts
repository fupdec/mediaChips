import type { BrowserWindow as BrowserWindowInstance, WebContents, IpcMainInvokeEvent, IpcMainEvent } from 'electron'

import { apiErrorMessage } from './api/types/errors'
const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog,
  shell,
} = require('electron')
process.electron_app = app

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.warn('MediaChips is already running. Exiting second instance.')
  process.exit(0)
}

const os = require('os')
const fs = require('fs')
const path = require('path')

if (process.platform === 'win32') {
  const disableGpu = ['1', 'true', 'yes', 'on'].includes(
    String(process.env.MEDIA_CHIPS_DISABLE_GPU || '').toLowerCase()
  )
  if (disableGpu) {
    app.disableHardwareAcceleration()
  }
}

const server = require('./app/server.js')
const {initAppUpdater} = require('./electron/autoUpdater')

const isWindows = os.type() === 'Windows_NT'
// TEMP: match src/utils/debugWinElectronUi.js — remove when done debugging header UI
const TEMP_FORCE_WIN_ELECTRON_UI = false
const useWinElectronFrame = isWindows || TEMP_FORCE_WIN_ELECTRON_UI

let win: BrowserWindowInstance | null = null
let loading: BrowserWindowInstance | null = null
let player: BrowserWindowInstance | null = null
let suppressZoomChangedEvent = false
const isDevelopment = process.env.NODE_ENV !== 'production'

const bindZoomChangedListener = (browserWindow: BrowserWindowInstance) => {
  if (!browserWindow || browserWindow.isDestroyed()) return

  const {webContents} = browserWindow

  webContents.on('before-input-event', (event: Electron.Event, input: Electron.Input) => {
    if (
      input.type === 'gesturePinchBegin'
      || input.type === 'gesturePinchUpdate'
      || input.type === 'gesturePinchEnd'
    ) {
      event.preventDefault()
    }
  })

  try {
    webContents.setVisualZoomLevelLimits(1, 1)
  } catch {}

  webContents.on('zoom-changed', () => {
    if (suppressZoomChangedEvent) return
    browserWindow.webContents.send('zoom-changed', browserWindow.webContents.getZoomFactor())
  })
}

const setWebContentsZoomFactor = (webContents: WebContents, factor: unknown) => {
  if (!webContents || webContents.isDestroyed()) return 1

  const clamped = Math.min(3, Math.max(0.5, Number(factor) || 1))
  suppressZoomChangedEvent = true
  webContents.setZoomFactor(clamped)
  suppressZoomChangedEvent = false
  return clamped
}

const sendConfigToWindow = (browserWindow: BrowserWindowInstance) => {
  if (!browserWindow || browserWindow.isDestroyed()) return
  browserWindow.webContents.send('config', server.config)
}

const createWindow = () => {
  win = new BrowserWindow({
    show: false,
    height: server.config.win?.height || 720,
    width: server.config.win?.width || 1280,
    frame: !useWinElectronFrame,
    thickFrame: useWinElectronFrame,
    titleBarStyle: os.type() === 'Darwin' && !useWinElectronFrame ? 'hidden' : 'default',
    trafficLightPosition: os.type() === 'Darwin' && !useWinElectronFrame ? {x: 18, y: 15} : null,
    backgroundColor: '#333',
    icon: path.join(__dirname, 'dist/icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, './electron/preload.js'),
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
    },
  })
  const mainWindow = win!
  mainWindow.loadURL(`http://localhost:${server.config.port}/`)
  mainWindow.on('closed', () => {
    if (process.platform !== 'darwin') app.quit()
    else win = null
  })
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('maximize')
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('unmaximize')
  })
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('enter-full-screen')
  })
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('leave-full-screen')
  })
  mainWindow.on('blur', () => {
    mainWindow.webContents.send('blur')
  })
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('focus')
  })
  bindZoomChangedListener(mainWindow)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
  mainWindow.webContents.on('did-finish-load', () => {
    sendConfigToWindow(mainWindow)
    // Renderer may mount after the first paint; resend config for late listeners.
    setTimeout(() => sendConfigToWindow(mainWindow), 500)
    setTimeout(() => sendConfigToWindow(mainWindow), 2000)
    setTimeout(warmupPlayerWindow, 1500)
    if (isDevelopment) {
      // mainWindow.webContents.openDevTools();
    }
  })
}

ipcMain.handle('get-config', () => server.config)

ipcMain.handle('get-machine-id', async () => {
  const {machineId} = require('node-machine-id')
  return machineId()
})

ipcMain.handle('setZoomFactor', (event: IpcMainInvokeEvent, factor: unknown) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender)
  if (!browserWindow || browserWindow.isDestroyed()) return 1
  return setWebContentsZoomFactor(browserWindow.webContents, factor)
})

ipcMain.handle('getZoomFactor', (event: IpcMainInvokeEvent) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender)
  if (!browserWindow || browserWindow.isDestroyed()) return 1
  return browserWindow.webContents.getZoomFactor()
})

ipcMain.handle('checkFileExists', async (_event: IpcMainInvokeEvent, data: Record<string, unknown>) => {
  const {normalizeMediaPath} = require('./api/utils/normalizeUserPath')
  const {resolveExistingPath} = require('./api/services/contentHash')
  const rawPath = typeof data === 'string' ? data : data?.path
  if (!rawPath) return false

  try {
    const filePath = normalizeMediaPath(rawPath)
    return Boolean(await resolveExistingPath(filePath))
  } catch {
    return false
  }
})

ipcMain.handle('openPath', async (_event: IpcMainInvokeEvent, data: Record<string, unknown>) => {
  let entryPath = typeof data === 'string' ? data : data?.path
  if (!entryPath) return {error: 'Path is required'}

  entryPath = path.normalize(entryPath)
  if (data?.isDir) entryPath = path.dirname(entryPath)

  const error = await shell.openPath(entryPath)
  return error ? {error} : {success: true}
})

ipcMain.handle('dialog:saveFile', async (_event: IpcMainInvokeEvent, options: { defaultPath?: string; content?: string; filters?: Array<{ name: string; extensions: string[] }> } = {}) => {
  const result = await dialog.showSaveDialog({
    defaultPath: options.defaultPath,
    filters: options.filters || [{name: 'All Files', extensions: ['*']}],
  })

  if (result.canceled || !result.filePath) {
    return {canceled: true}
  }

  fs.writeFileSync(result.filePath, options.content ?? '', 'utf8')
  return {canceled: false, filePath: result.filePath}
})

ipcMain.handle('toggleDevTools', () => {
  if (win && !win.isDestroyed()) {
    win.webContents.toggleDevTools()
  }
})

// TODO speed up loading window display
const createLoadingWindow = () => {
  loading = new BrowserWindow({
    width: 320,
    height: 320,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    backgroundColor: '#333',
    icon: __dirname + `/icons/icon.png`,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false,
      contextIsolation: false
    },
  })
  const loadingWindow = loading!
  loadingWindow.hide()
  if (isDevelopment) {
    loadingWindow.once('show', () => {
      win?.webContents.on('did-finish-load', () => {
        console.log('App loaded')
        win?.show()
        loading?.hide()
      })
    })
  } else {
    createProtocol('app')
    loadingWindow.once('show', () => {
      win?.webContents.on('did-finish-load', () => {
        console.log('App loaded')
        win?.show()
        loading?.hide()
        loading = null
      })
    })
  }
  loadingWindow.loadURL(path.join('file://', __dirname, 'dist', 'loading.html'))
  loadingWindow.webContents.on('did-finish-load', () => {
    // loading.show()
  })
}

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    if (!win.isVisible()) win.show()
    win.focus()
  }
})

app.on('ready', () => {
  createLoadingWindow()
  createWindow()
  initAppUpdater({getWindow: () => win})
})

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) createWindow();
});

function quitApp() {
  if (playerWarmupTimer) {
    clearTimeout(playerWarmupTimer)
    playerWarmupTimer = null
  }
  if (player && !player.isDestroyed()) {
    player.destroy()
    player = null
  }
  if (win && !win.isDestroyed()) {
    win.close()
  }
  if (server.listener) {
    server.listener.close()
  }
  app.quit()
}

// window events from render process
ipcMain.on('closeApp', quitApp)

app.on('window-all-closed', () => {
  if (process.platform !== "darwin") // close if not macOS
    app.quit();
});

function stopPlayerPlayback() {
  if (player && !player.isDestroyed()) {
    player.webContents.send('stop-playing-video')
  }
}

ipcMain.handle('closePlayer', () => {
  stopPlayerPlayback()
  if (player && !player.isDestroyed()) {
    player.hide()
  }
})

ipcMain.handle('maximize', (_event: IpcMainInvokeEvent, args: unknown) => {
  if (args === 'player') {
    player?.maximize()
  } else {
    win?.maximize()
  }
})
ipcMain.handle('unmaximize', (_event: IpcMainInvokeEvent, args: unknown) => {
  if (args === 'player') {
    player?.unmaximize()
  } else {
    win?.unmaximize()
  }
})
ipcMain.handle('minimize', (_event: IpcMainInvokeEvent, args: unknown) => {
  if (args === 'player') {
    player?.minimize()
  } else {
    win?.minimize()
  }
})
ipcMain.handle('relaunch', () => {
  app.relaunch()
  app.exit()
})

let systemMenu = Menu.buildFromTemplate([
  {
    label: 'App',
    submenu: [
      {
        label: 'Lock',
        id: 'lock',
        enabled: true,
        click() {
          lockApp()
        }
      },
      {type: 'separator'},
      {
        label: 'Exit',
        accelerator: 'CommandOrControl+Q',
        click() {
          app.exit()
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {role: 'zoomIn'},
      {role: 'zoomOut'},
      {role: 'resetZoom'},
      {type: 'separator'},
      {role: 'togglefullscreen'},
    ],
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CommandOrControl+Z',
        role: 'undo',
      },
      {
        label: 'Redo',
        accelerator: 'CommandOrControl+Y',
        role: 'redo',
      },
      {type: 'separator'},
      {
        label: 'Cut',
        accelerator: 'CommandOrControl+X',
        role: 'cut',
      },
      {
        label: 'Copy',
        accelerator: 'CommandOrControl+C',
        role: 'copy',
      },
      {
        label: 'Paste',
        accelerator: 'CommandOrControl+V',
        role: 'paste',
      },
      {type: 'separator'},
      {
        label: 'Select all',
        accelerator: 'CommandOrControl+A',
        role: 'selectAll',
      },
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Toggle Developer Tools',
        accelerator: 'CommandOrControl+Shift+I',
        role: 'toggleDevTools',
      },
      {type: 'separator'},
      {
        label: 'About',
        click() {
          aboutApp()
        }
      },
    ]
  },
])

Menu.setApplicationMenu(systemMenu)

function lockApp() {
  win?.webContents.send('lockApp')
  player?.webContents.send('stop-playing-video')
}

function aboutApp() {
  win?.webContents.send('aboutApp')
}

process.on('uncaughtException', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    dialog.showErrorBox('Startup Error',
      `Port 12321 is already in use.\n\n` +
      `Please close other applications using this port and restart the application.`
    );
    app.quit();
  } else {
    console.error('Uncaught Exception:', error);
  }
});

// folder selection dialog and getting their paths
ipcMain.handle('showOpenDialog', async (_event: IpcMainInvokeEvent, properties: unknown) => {
  console.log('showOpenDialog called with properties:', properties);

  // Check that properties is an array
  let dialogProperties = [];

  if (Array.isArray(properties)) {
    dialogProperties = properties;
  } else {
    console.warn('Properties should be an array, received:', typeof properties);
    // Attempt to convert
    if (typeof properties === 'string') {
      dialogProperties = [properties];
    } else if (typeof properties === 'object' && properties !== null) {
      dialogProperties = Object.keys(properties).filter(key => (properties as Record<string, unknown>)[key] === true);
    }
  }

  console.log('Dialog properties being used:', dialogProperties);

  try {
    const result = await dialog.showOpenDialog({
      properties: dialogProperties,
    });

    console.log('Dialog closed, result:', {
      canceled: result.canceled,
      filePaths: result.filePaths,
      filePathsLength: result.filePaths.length
    });

    if (result.canceled) {
      return { canceled: true, filePaths: [] };
    }

    return {
      canceled: false,
      filePaths: result.filePaths,
      message: 'Directories selected successfully'
    };

  } catch (error: unknown) {
    console.error('Error in showOpenDialog:', error);
    return {
      error: true,
      message: error instanceof Error ? apiErrorMessage(error) : String(error),
      filePaths: []
    };
  }
});

// player window
let pendingPlayerPayload: unknown = null
let isPlayerRendererReady = false
let playerWarmupTimer: ReturnType<typeof setTimeout> | null = null

function getPlayerWindowOptions() {
  return {
    frame: false,
    thickFrame: isWindows,
    show: false,
    height: server.config.player?.height || 720,
    width: server.config.player?.width || 1280,
    titleBarStyle: 'hidden',
    trafficLightPosition: os.type() === 'Darwin' ? {x: 12, y: 8} : null,
    backgroundColor: '#000000',
    icon: path.join(__dirname, 'dist/icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, './electron/preload.js'),
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
    },
  }
}

function setupPlayerWindowEvents(browserWindow: BrowserWindowInstance) {
  browserWindow.on('maximize', () => {
    browserWindow.webContents.send('maximize')
  })

  browserWindow.on('unmaximize', () => {
    browserWindow.webContents.send('unmaximize')
  })

  browserWindow.on('close', () => {
    stopPlayerPlayback()
  })

  browserWindow.on('closed', () => {
    player = null
    isPlayerRendererReady = false
    pendingPlayerPayload = null
    schedulePlayerWarmup()
  })

  browserWindow.on('enter-full-screen', () => {
    browserWindow.webContents.send('enter-full-screen')
  })

  browserWindow.on('leave-full-screen', () => {
    browserWindow.webContents.send('leave-full-screen')
  })

  browserWindow.webContents.on('did-finish-load', () => {
    sendConfigToWindow(browserWindow)
  })

  bindZoomChangedListener(browserWindow)
}

function createPlayerWindow() {
  if (player && !player.isDestroyed()) return player

  isPlayerRendererReady = false
  player = new BrowserWindow(getPlayerWindowOptions())
  const playerWindow = player!
  setupPlayerWindowEvents(playerWindow)
  playerWindow.loadURL(`http://localhost:${server.config.port}/?player=true`)
  return playerWindow
}

function deliverPlayerPayload(data: unknown) {
  if (!player || player.isDestroyed()) return

  sendConfigToWindow(player)
  player.webContents.send('play-video', data)
  if (!player.isVisible()) player.show()
  player.focus()
}

function schedulePlayerWarmup() {
  if (playerWarmupTimer) return

  playerWarmupTimer = setTimeout(() => {
    playerWarmupTimer = null
    if (!player || player.isDestroyed()) {
      createPlayerWindow()
    }
  }, 1500)
}

function warmupPlayerWindow() {
  if (player && !player.isDestroyed()) return
  createPlayerWindow()
}

ipcMain.on('player-ready', (event: IpcMainEvent) => {
  if (!player || player.isDestroyed() || event.sender !== player.webContents) return

  isPlayerRendererReady = true

  if (pendingPlayerPayload) {
    deliverPlayerPayload(pendingPlayerPayload)
    pendingPlayerPayload = null
  }
})

// for passing state between windows
let temporaryStore: unknown
ipcMain.on('open-player', async (_event: IpcMainEvent, data: Record<string, unknown>) => {
  temporaryStore = data.store

  if (!player || player.isDestroyed()) {
    pendingPlayerPayload = data
    createPlayerWindow()
    return
  }

  if (isPlayerRendererReady) {
    deliverPlayerPayload(data)
    return
  }

  pendingPlayerPayload = data
  if (!player.isVisible()) player.show()
})
ipcMain.on('getItemsFromDb', async (_event: IpcMainEvent, data: unknown) => {
  win?.webContents.send('getItemsFromDb', data)
})
ipcMain.on('updateVideoFrames', async (_event: IpcMainEvent, id: unknown) => {
  win?.webContents.send('updateVideoFrames', id)
})
ipcMain.on('removeEntitiesFromState', async (_event: IpcMainEvent, data: unknown) => {
  win?.webContents.send('removeEntitiesFromState', data)
})
ipcMain.on('stop-playing-video', async () => {
  player?.webContents.send('stop-playing-video')
})
ipcMain.on('setFullScreen', async () => {
  player?.setFullScreen(false)
})