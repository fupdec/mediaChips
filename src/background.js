'use strict'

const fs = require("fs-extra")
const path = require("path")

import { ipcMain, app, protocol, BrowserWindow, Menu, MenuItem  } from 'electron'
import {
  createProtocol,
  /* installVueDevtools */
} from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let loading 

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }])

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ 
    width: 1400, 
    height: 800, 
    frame: false,
    backgroundColor: '#333',
    icon: __static + `/icons/icon.png`,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false 
    },
    show: false
  })
  loading = new BrowserWindow({
    width: 320, 
    height: 320, 
    show: false, 
    frame: false,
    backgroundColor: '#333',
    icon: __static + `/icons/icon.png`,
  })
  
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    loading.once('show', () => {
      win.webContents.on('did-finish-load', () => {
        console.log('app loaded')
        win.show() 
        loading.hide()
      })
      win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
      // Load the url of the dev server if in development mode
      if (!process.env.IS_TEST) win.webContents.openDevTools()
    })
    loading.loadURL(path.join(__static, 'loading.html'))
    loading.show() 
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    loading.once('show', () => {
      win.webContents.on('did-finish-load', () => {
        console.log('app loaded')
        win.show()
        loading.hide() 
        loading.close()
      })
      win.loadURL('app://./index.html')
    })
    loading.loadURL(path.join(__static, 'loading.html'))
    loading.show()
  }

  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// create userdata folder if runs portable version
if (process.env.PORTABLE_EXECUTABLE_DIR) {
  const userData = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'userdata')
  if (!fs.existsSync(userData)){
    fs.mkdirSync(userData)
  }
  app.setPath ('userData', userData)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools()
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }

  }
  
  // create folder for user's files
  const srcUserDataFolder = path.join(__static, 'userfiles')
  const destUserDataFolder = path.join(app.getPath('userData'), 'userfiles')
  if (!fs.existsSync(destUserDataFolder)){
    fs.mkdirSync(destUserDataFolder)
    fs.mkdirSync(path.join(destUserDataFolder, 'backups'))
    fs.mkdirSync(path.join(destUserDataFolder, 'databases'))
    fs.mkdirSync(path.join(destUserDataFolder, 'ffmpeg'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/performers'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/previews'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/tags'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/temp'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/temp/merging'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/temp/parts'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/thumbs'))
    fs.mkdirSync(path.join(destUserDataFolder, 'media/websites'))
    fs.copy(srcUserDataFolder, destUserDataFolder, function (err) {
      if (err) {
        console.error(err);
      } else {
        console.log("user data folder created successfully!\nDon't forget to copy ffmpeg files");
      } 
    }) 
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// restart application
ipcMain.on('reload', function() {
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.reload()
  } else {
    app.relaunch()
    app.exit()
  }
})

// keyboard shortcuts
const menu = new Menu()
menu.append(new MenuItem({
  label: 'App',
  submenu: [
    {
      role: 'help',
      accelerator: process.platform === 'darwin' ? 'Cmd+R' : 'Ctrl+R',
      click: () => { console.log('Page reloading is disabled!') }
    },
    {
      role: 'tool',
      accelerator: process.platform === 'darwin' ? 'Cmd+Shift+I' : 'Ctrl+Shift+I',
      click: () => { win.webContents.openDevTools() }
    },
  ]
}))

Menu.setApplicationMenu(menu)