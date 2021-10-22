'use strict'

import { ipcMain, app, protocol, BrowserWindow, Menu, MenuItem  } from 'electron'
import { createProtocol, /* installVueDevtools */} from 'vue-cli-plugin-electron-builder/lib'

const fs = require("fs-extra")
const path = require("path")
const isDevelopment = process.env.NODE_ENV !== 'production'
const shell = require('electron').shell
// const pluginLoader = require('./plugin-loader')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win, loading, player

protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }])

function createLoadingWindow () {
  loading = new BrowserWindow({
    width: 320, 
    height: 320, 
    show: false, 
    frame: false,
    resizable: false,
    alwaysOnTop: true, 
    backgroundColor: '#333',
    icon: __static + `/icons/icon.png`,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false,
      contextIsolation: false
    },
  })
  
  if (isDevelopment) {
    loading.once('show', () => {
      win.webContents.on('did-finish-load', () => {
        console.log('app loaded')
        win.show() 
        loading.hide()
      })
    })
  } else {
    createProtocol('app')
    loading.once('show', () => {
      win.webContents.on('did-finish-load', () => {
        console.log('app loaded')
        win.show()
        loading.hide() 
        loading = null
      })
    })
  }
  loading.loadURL(path.join('file://', __static, 'loading.html'))
  loading.webContents.on('did-finish-load', () => { loading.show() })
} 

function createPlayerWindow() {
  // Create the browser window.
  let window = new BrowserWindow({
    width: 1200,
    height: 700,
    frame: process.platform !== 'win32',
    backgroundColor: '#333',
    icon: __static + `/icons/icon.png`,
    show: false, 
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,  
      nodeIntegrationInWorker: true,
      webSecurity: false,
      enableRemoteModule: true,
      contextIsolation: false
    }
  })

  if (isDevelopment) {
    window.loadURL(process.env.WEBPACK_DEV_SERVER_URL + 'player.html')
    if (!process.env.IS_TEST) window.webContents.openDevTools()
  } else window.loadURL(path.join('file://', __static, 'player.html'))

  window.on('close', (e) => {
    e.preventDefault()
    window.hide()
    window.webContents.send('closePlayer')
  })
  return window
}

function createMainWindow() {
  // Create the browser window.
  let window = new BrowserWindow({
    width: 1200,
    height: 700,
    frame: process.platform !== 'win32',
    backgroundColor: '#333',
    icon: __static + `/icons/icon.png`,
    show: false, 
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,  
      nodeIntegrationInWorker: true,
      webSecurity: false,
      enableRemoteModule: true,
      contextIsolation: false
    }
  })

  if (isDevelopment) {
    window.loadURL(process.env.WEBPACK_DEV_SERVER_URL + 'index.html')
    if (!process.env.IS_TEST) window.webContents.openDevTools()
  } else window.loadURL(path.join('file://', __static, 'index.html'))
  
  window.on('closed', () => {
    loading = null 
    player = null 
    win = null  
    app.exit()
  })
  return window
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

// create userdata folder if runs portable version
if (process.env.PORTABLE_EXECUTABLE_DIR) {
  const userData = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'userdata')
  if (!fs.existsSync(userData)) fs.mkdirSync(userData) 
  app.setPath ('userData', userData)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  // create folder for user's files
  const destUserDataFolder = path.join(app.getPath('userData'), 'userfiles')
  if (!fs.existsSync(destUserDataFolder)) {
    fs.mkdirSync(destUserDataFolder)
    fs.mkdirSync(path.join(destUserDataFolder, 'backups'))
    fs.mkdirSync(path.join(destUserDataFolder, 'databases'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/grids'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/timelines'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/thumbs'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/markers'))
  }
  const metaFolder = path.join(destUserDataFolder, 'media', 'meta')
  if (!fs.existsSync(metaFolder)) fs.mkdirSync(metaFolder)
  if (!isDevelopment) createProtocol('app')
  win = createMainWindow()
  player = createPlayerWindow()
  createLoadingWindow()
})

// local file support
app.whenReady().then(() => {
  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURIComponent(request.url.replace('file://', ''))
    callback(pathname)
  })
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => { if (data === 'graceful-exit') app.quit() })
  } else process.on('SIGTERM', () => { app.quit() })
}

// restart application
ipcMain.on('reload', function () {
  if (isDevelopment) win.reload()
  else { app.relaunch(); app.exit() } // TODO fix relaunch
})

let systemMenu = Menu.buildFromTemplate([
  {
    label: 'App',
    submenu: [
      {
        label: 'Add New Videos...',
        click() { addNewVideos() } 
      },
      {
        label: 'Check for Updates...',
        click() { checkForUpdates() } 
      },
      { type:'separator' },
      { 
        label:'Play Video in System Player', 
        id: 'systemPlayer',
        type: 'checkbox',
        checked: true, 
        click() { toggleSystemPlayer() } 
      },
      { type:'separator' },
      { 
        label:'Lock',
        id: 'lock',
        enabled: false, 
        click() { lockApp() } 
      },
      { type:'separator' },
      { 
        label:'Exit', 
        click() { app.quit() } 
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
      { type:'separator' },
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
      { type:'separator' },
      {
        label: 'Select all',
        accelerator: 'CommandOrControl+A',
        role: 'selectAll',
      },
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Toggle Dark Mode',
        click() { toggleDarkMode() } 
      },
      { type:'separator' },
      {
        label: 'Navigation bar',
        submenu: [
          {
            label: 'Side',
            click() { updateSettingsState('navigationSide', '1') } 
          },
          {
            label: 'Bottom',
            click() { updateSettingsState('navigationSide', '2') } 
          },
        ]
      },
      {
        label: 'Gap in Card Grid',
        submenu: [
          {
            label: 'Extra Small',
            click() { updateSettingsState('gapSize', 'xs') } 
          },
          {
            label: 'Small',
            click() { updateSettingsState('gapSize', 's') } 
          },
          {
            label: 'Medium',
            click() { updateSettingsState('gapSize', 'm') } 
          },
          {
            label: 'Large',
            click() { updateSettingsState('gapSize', 'l') } 
          },
          {
            label: 'Extra Large',
            click() { updateSettingsState('gapSize', 'xl') } 
          },
        ]
      },
      { type:'separator' },
      {
        label: 'Zoom in',
        click() { updateSettingsState('zoom', '+') } 
      },
      {
        label: 'Zoom out',
        click() { updateSettingsState('zoom', '-') } 
      },
      {
        label: 'Reset zoom',
        click() { updateSettingsState('zoom') } 
      },
    ]
  },
  {
    label: 'Navigation',
    submenu: [
      {
        label: 'Back',
        accelerator: 'CommandOrControl+Shift+Left',
        click() { navigationBack() } 
      },
      {
        label: 'Forward',
        accelerator: 'CommandOrControl+Shift+Right',
        click() { navigationForward() } 
      },
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Documentation',
        click() { 
          shell.openExternal('https://mediachips.app/docs')
        } 
      },
      { type:'separator' },
      {
        label: 'Toggle Developer Tools',
        accelerator: 'CommandOrControl+Shift+I',
        role: 'toggleDevTools',
      },
      { type:'separator' },
      {
        label: 'About',
        click() { aboutApp() } 
      },
    ]
  },
])

Menu.setApplicationMenu(systemMenu)

// system menu events for main window
function addNewVideos() { win.webContents.send( 'addNewVideos' ) }
function checkForUpdates() { win.webContents.send( 'checkForUpdates' ) }
function toggleSystemPlayer() { win.webContents.send( 'toggleSystemPlayer' ) }
function toggleDarkMode() { win.webContents.send( 'toggleDarkMode' ) }
function lockApp() { win.webContents.send( 'lockApp' ) }
function aboutApp() { win.webContents.send( 'aboutApp' ) }
function navigationBack() { win.webContents.send( 'navigationBack' ) }
function navigationForward() { win.webContents.send( 'navigationForward' ) }
ipcMain.on('toggleDevTools', () => { win.webContents.toggleDevTools() })
function updateSettingsState(stateName, value) { 
  win.webContents.send( 'updateSettingsState', stateName, value ) 
}
ipcMain.on('changeMenuItem', (event, menuId, value) => {
  if (menuId == 'lock') systemMenu.getMenuItemById(menuId).enabled = value
  else systemMenu.getMenuItemById(menuId).checked = value
})

// events from render process
ipcMain.on('openPlayer', (event, data) => {
  player.show()
  player.webContents.send('getDataForPlayer', data)
})
ipcMain.on('closePlayer', () => { player.hide() })
ipcMain.handle('getDb', async (event, dbType) => {
  win.webContents.send( 'getDb', dbType )
  const database = await getDb()
  player.webContents.send( 'getDbAnswer', database )
})
function getDb() { return new Promise((resolve) => {
  ipcMain.once('getDbAnswer', (e, database) => { resolve(database) }) 
}) } 
ipcMain.on('watchLater', (e, videoId) => { win.webContents.send( 'watchLater', videoId ) })
ipcMain.on('addMarker', (e, marker, markerTag, video) => { win.webContents.send( 'addMarker', marker, markerTag, video ) }) 
ipcMain.on('removeMarker', (e, markerForRemove, video) => { win.webContents.send( 'removeMarker', markerForRemove, video ) }) 
ipcMain.on('toggleDarkMode', (e, value) => { player.webContents.send( 'toggleDarkMode', value ) })
ipcMain.on('updatePlayerDb', (e, value) => { player.webContents.send( 'updateDb', value ) })
ipcMain.on('addNewMetaCard', (e, metaCardName, metaId) => { win.webContents.send( 'addNewMetaCard', metaCardName, metaId ) }) 
ipcMain.on('videoWatched', (e, videoId) => { win.webContents.send( 'videoWatched', videoId ) }) 

// plugins 
// ipcMain.on('installPlugin', (event, pluginsDir) => {
//   pluginLoader(pluginsDir).then((result) => {
//     console.log( result ) 
//     win.webContents.send( 'getPlugin', result ) 
//   })
// })