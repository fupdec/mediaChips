const {app, ipcMain, shell} = require('electron')
const {execSync} = require('child_process')
const {autoUpdater} = require('electron-updater')

const RELEASES_URL = 'https://github.com/fupdec/MediaChips/releases/latest'
const RELEASES_BASE = 'https://github.com/fupdec/MediaChips/releases/download'

let getMainWindow = () => null
let currentState = {state: 'idle'}

function isPortableBuild() {
  return Boolean(process.env.PORTABLE_EXECUTABLE_DIR)
}

function isAppleDeveloperSigned() {
  if (process.platform !== 'darwin') return false
  try {
    const output = execSync(`codesign -dv --verbose=2 "${process.execPath}" 2>&1`, {
      encoding: 'utf8',
    })
    return /Authority=Developer ID Application/i.test(output)
  } catch {
    return false
  }
}

function requiresManualInstall() {
  if (process.platform !== 'darwin') return false
  if (process.env.MEDIA_CHIPS_MAC_AUTO_INSTALL === '1') return false
  return !isAppleDeveloperSigned()
}

function getMacDmgUrl(version) {
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  return `${RELEASES_BASE}/v${version}/MediaChips.v${version}.Mac.${arch}.dmg`
}

function isSignatureValidationError(message) {
  const text = String(message || '')
  return /code signature/i.test(text) || /не удалось удовлетворить требован/i.test(text)
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
  currentState = {
    ...currentState,
    manualInstall: requiresManualInstall(),
    releasesUrl: RELEASES_URL,
    ...payload,
  }
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

function sendDownloadedStatus(info) {
  const nextVersion = info.version
  if (requiresManualInstall()) {
    sendStatus({
      state: 'downloaded-manual',
      nextVersion,
      downloadUrl: getMacDmgUrl(nextVersion),
    })
    return
  }

  sendStatus({
    state: 'downloaded',
    nextVersion,
  })
}

function initAppUpdater({getWindow}) {
  getMainWindow = getWindow

  const disabledReason = getDisabledReason()
  if (disabledReason) {
    currentState = {
      state: 'disabled',
      reason: disabledReason,
      manualInstall: requiresManualInstall(),
      releasesUrl: RELEASES_URL,
    }
  } else {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = !requiresManualInstall()
    autoUpdater.allowDowngrade = false

    autoUpdater.on('checking-for-update', () => {
      sendStatus({state: 'checking'})
    })

    autoUpdater.on('update-available', (info) => {
      const nextVersion = info.version
      const payload = {
        currentVersion: app.getVersion(),
        nextVersion,
        releaseNotes: formatReleaseNotes(info),
      }

      if (requiresManualInstall()) {
        sendStatus({
          ...payload,
          state: 'available-manual',
          downloadUrl: getMacDmgUrl(nextVersion),
        })
        return
      }

      sendStatus({
        ...payload,
        state: 'available',
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
      sendDownloadedStatus(info)
    })

    autoUpdater.on('error', (error) => {
      const message = error?.message || String(error)
      if (isSignatureValidationError(message) && requiresManualInstall()) {
        const nextVersion = currentState.nextVersion || app.getVersion()
        sendStatus({
          state: 'downloaded-manual',
          nextVersion,
          downloadUrl: currentState.downloadUrl || getMacDmgUrl(nextVersion),
          message,
        })
        return
      }

      sendStatus({
        state: 'error',
        message,
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

    if (requiresManualInstall() || currentState.state === 'downloaded-manual') {
      const url = currentState.downloadUrl || RELEASES_URL
      shell.openExternal(url)
      return {...currentState}
    }

    autoUpdater.quitAndInstall(false, true)
    return {...currentState}
  })
}

module.exports = {
  initAppUpdater,
  isUpdaterSupported,
  requiresManualInstall,
  RELEASES_URL,
}
