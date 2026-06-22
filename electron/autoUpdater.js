const {app, ipcMain} = require('electron')
const {autoUpdater} = require('electron-updater')

const RELEASES_URL = 'https://github.com/fupdec/MediaChips/releases/latest'

let getMainWindow = () => null
let currentState = {state: 'idle'}

function isPortableBuild() {
  return Boolean(process.env.PORTABLE_EXECUTABLE_DIR)
}

function isUpdaterSupported() {
  if (!app.isPackaged) return false
  if (process.env.MEDIA_CHIPS_DISABLE_UPDATER === '1') return false
  if (isPortableBuild()) return false
  return true
}

function getDisabledReason() {
  if (isPortableBuild()) return 'portable'
  if (!app.isPackaged) return 'dev'
  if (process.env.MEDIA_CHIPS_DISABLE_UPDATER === '1') return 'disabled'
  return null
}

function sendStatus(payload) {
  currentState = {...currentState, ...payload, releasesUrl: RELEASES_URL}
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('updater:status', currentState)
  }
}

function formatReleaseNotes(info) {
  if (!info?.releaseNotes) return ''
  if (typeof info.releaseNotes === 'string') return info.releaseNotes
  if (Array.isArray(info.releaseNotes)) {
    return info.releaseNotes
      .map((note) => (typeof note === 'string' ? note : note?.note || ''))
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

function initAppUpdater({getWindow}) {
  getMainWindow = getWindow

  const disabledReason = getDisabledReason()
  if (disabledReason) {
    currentState = {state: 'disabled', reason: disabledReason, releasesUrl: RELEASES_URL}
  } else {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.allowDowngrade = false

    autoUpdater.on('checking-for-update', () => {
      sendStatus({state: 'checking'})
    })

    autoUpdater.on('update-available', (info) => {
      sendStatus({
        state: 'available',
        currentVersion: app.getVersion(),
        nextVersion: info.version,
        releaseNotes: formatReleaseNotes(info),
      })
    })

    autoUpdater.on('update-not-available', (info) => {
      sendStatus({
        state: 'up-to-date',
        currentVersion: info?.version || app.getVersion(),
      })
    })

    autoUpdater.on('download-progress', (progress) => {
      sendStatus({
        state: 'downloading',
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total,
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      sendStatus({
        state: 'downloaded',
        nextVersion: info.version,
      })
    })

    autoUpdater.on('error', (error) => {
      sendStatus({
        state: 'error',
        message: error?.message || String(error),
      })
    })
  }

  ipcMain.handle('updater:is-supported', () => isUpdaterSupported())

  ipcMain.handle('updater:get-state', () => ({...currentState}))

  ipcMain.handle('updater:check', async () => {
    if (!isUpdaterSupported()) {
      return {...currentState}
    }
    try {
      await autoUpdater.checkForUpdates()
      return {...currentState}
    } catch (error) {
      sendStatus({state: 'error', message: error.message})
      return {...currentState}
    }
  })

  ipcMain.handle('updater:download', async () => {
    if (!isUpdaterSupported()) {
      return {...currentState}
    }
    try {
      await autoUpdater.downloadUpdate()
      return {...currentState}
    } catch (error) {
      sendStatus({state: 'error', message: error.message})
      return {...currentState}
    }
  })

  ipcMain.handle('updater:install', () => {
    if (!isUpdaterSupported()) {
      return {...currentState}
    }
    autoUpdater.quitAndInstall(false, true)
    return {...currentState}
  })
}

module.exports = {
  initAppUpdater,
  isUpdaterSupported,
  RELEASES_URL,
}
