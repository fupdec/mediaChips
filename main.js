const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog,
} = require('electron')
process.electron_app = app

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.warn('MediaChips is already running. Exiting second instance.')
  process.exit(0)
}

const os = require('os')
const path = require('path')
process.env.MEDIA_CHIPS_ALLOW_LAN = process.env.MEDIA_CHIPS_ALLOW_LAN || '1'

if (process.platform === 'win32') {
  const disableGpu = ['1', 'true', 'yes', 'on'].includes(
    String(process.env.MEDIA_CHIPS_DISABLE_GPU || '').toLowerCase()
  )
  if (disableGpu) {
    app.disableHardwareAcceleration()
  }
}

const server = require('./app/server.js')
const {autoUpdater} = require('electron-updater')

const isWindows = os.type() === 'Windows_NT'

let win = null
let loading = null
let player = null
const isDevelopment = process.env.NODE_ENV !== 'production'

const sendConfigToWindow = (browserWindow) => {
  if (!browserWindow || browserWindow.isDestroyed()) return
  browserWindow.webContents.send('config', server.config)
}

const createWindow = () => {
  win = new BrowserWindow({
    show: false,
    height: server.config.win?.height || 720,
    width: server.config.win?.width || 1280,
    frame: !isWindows,
    thickFrame: isWindows,
    titleBarStyle: os.type() === 'Darwin' ? 'hidden' : 'default',
    trafficLightPosition: os.type() === 'Darwin' ? {x: 18, y: 15} : null,
    backgroundColor: '#333',
    icon: path.join(__dirname, 'dist/icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, './electron/preload.js'),
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
    },
  })
  win.loadURL(`http://localhost:${server.config.port}/`)
  win.on('closed', () => {
    if (process.platform !== 'darwin') app.quit()
    else win = null
  })
  win.on('maximize', () => {
    win.webContents.send('maximize')
  })
  win.on('unmaximize', () => {
    win.webContents.send('unmaximize')
  })
  win.on('enter-full-screen', () => {
    win.webContents.send('enter-full-screen')
  })
  win.on('leave-full-screen', () => {
    win.webContents.send('leave-full-screen')
  })
  win.on('blur', () => {
    win.webContents.send('blur')
  })
  win.on('focus', () => {
    win.webContents.send('focus')
  })
  win.once('ready-to-show', () => {
    win.show()
  })
  win.webContents.on('did-finish-load', () => {
    sendConfigToWindow(win)
    // Renderer may mount after the first paint; resend config for late listeners.
    setTimeout(() => sendConfigToWindow(win), 500)
    setTimeout(() => sendConfigToWindow(win), 2000)
    if (isDevelopment) {
      // win.webContents.openDevTools();
    }
  })
}

ipcMain.handle('get-config', () => server.config)

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
  loading.hide()
  if (isDevelopment) {
    loading.once('show', () => {
      win.webContents.on('did-finish-load', () => {
        console.log('App loaded')
        win.show()
        loading.hide()
      })
    })
  } else {
    createProtocol('app')
    loading.once('show', () => {
      win.webContents.on('did-finish-load', () => {
        console.log('App loaded')
        win.show()
        loading.hide()
        loading = null
      })
    })
  }
  loading.loadURL(path.join('file://', __dirname, 'dist', 'loading.html'))
  loading.webContents.on('did-finish-load', () => {
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
  //autoUpdater.checkForUpdates()
})

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) createWindow();
});

function quitApp() {
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

ipcMain.handle('closePlayer', () => {
  player.hide()
})

ipcMain.handle('maximize', (event, args) => {
  if (args === 'player') {
    player.maximize()
  } else {
    win.maximize()
  }
})
ipcMain.handle('unmaximize', (event, args) => {
  if (args === 'player') {
    player.unmaximize()
  } else {
    win.unmaximize()
  }
})
ipcMain.handle('minimize', (event, args) => {
  if (args === 'player') {
    player.minimize()
  } else {
    win.minimize()
  }
})
ipcMain.handle('relaunch', () => {
  app.relaunch()
  app.exit()
})


// auto updating
// only needed in development mode
Object.defineProperty(app, 'isPackaged', {
  get() {
    return true;
  }
});
autoUpdater.setFeedURL({
  "provider": "github",
  "private": true,
  "owner": "vitvvk",
  "repo": "mediachips",
});
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

/*New Update Available*/
autoUpdater.on("update-available", async (info) => {
  const text = `Update available. Current version ${app.getVersion()}`
  win.webContents.send('autoUpdater', text)
  const pth = await autoUpdater.downloadUpdate();
  console.info('\x1b[7m%s\x1b[0m', pth);
  win.webContents.send('autoUpdater', pth)
});

autoUpdater.on("update-not-available", (info) => {
  const text = `No update available. Current version ${app.getVersion()}`
  win.webContents.send('autoUpdater', text)
});

/*Download Completion Message*/
autoUpdater.on("update-downloaded", (info) => {
  const text = `Update downloaded. Current version ${app.getVersion()}`
  win.webContents.send('autoUpdater', text)
});

autoUpdater.on("error", (info) => {
  win.webContents.send('autoUpdater', info)
});

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
  win.webContents.send('lockApp')
  player.webContents.send('stop-playing-video')
}

function aboutApp() {
  win.webContents.send('aboutApp')
}

process.on('uncaughtException', (error) => {
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
ipcMain.handle('showOpenDialog', async (event, properties) => {
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
      dialogProperties = Object.keys(properties).filter(key => properties[key] === true);
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

  } catch (error) {
    console.error('Error in showOpenDialog:', error);
    return {
      error: true,
      message: error.message,
      filePaths: []
    };
  }
});

// player window
const startPlayer = (videos_data) => {
  player = new BrowserWindow({
    frame: false,
    height: server.config.player?.height || 720,
    width: server.config.player?.width || 1280,
    titleBarStyle: 'hidden',
    trafficLightPosition: os.type() === 'Darwin' ? {x: 12, y: 8} : null,
    backgroundColor: '#333',
    icon: path.join(__dirname, 'dist/icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, './electron/preload.js'),
      contextIsolation: true,
      sandbox: false,
    },
  })

  player.loadURL(`http://localhost:${server.config.port}/?player=true`)

  player.on('maximize', () => {
    player.webContents.send('maximize')
  })

  player.on('unmaximize', () => {
    player.webContents.send('unmaximize')
  })

  player.on('closed', (e) => {
    player = null
  })

  player.on('enter-full-screen', (e) => {
    player.webContents.send('enter-full-screen')
  })

  player.on('leave-full-screen', (e) => {
    player.webContents.send('leave-full-screen')
  })

  player.webContents.on('did-finish-load', (e) => {
    // IMPORTANT: Send configuration to player window
    player.webContents.send('config', server.config);
    player.webContents.send('play-video', videos_data);
  })
}

// for passing state between windows
let temporaryStore
ipcMain.on('open-player', async (event, data) => {
  temporaryStore = data.store
  const play = () => {
    player.webContents.send('play-video', data)
    player.show()
  }
  if (player === null) {
    startPlayer(data)
  } else {
    play()
  }
})
ipcMain.on('getItemsFromDb', async (event, data) => {
  win.webContents.send('getItemsFromDb', data)
})
ipcMain.on('removeEntitiesFromState', async (event, data) => {
  win.webContents.send('removeEntitiesFromState', data)
})
ipcMain.on('stop-playing-video', async () => {
  player.webContents.send('stop-playing-video')
})
ipcMain.on('setFullScreen', async () => {
  player.setFullScreen(false)
})