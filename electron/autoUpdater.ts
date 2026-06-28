import {app, ipcMain, shell, type BrowserWindow} from 'electron'
import {execSync} from 'child_process'
import {autoUpdater, type UpdateInfo, type ProgressInfo} from 'electron-updater'

import { apiErrorMessage } from '../api/types/errors'
export const RELEASES_URL = 'https://github.com/fupdec/MediaChips/releases/latest'
const RELEASES_BASE = 'https://github.com/fupdec/MediaChips/releases/download'

type UpdaterState = {
  state: string
  manualInstall?: boolean
  releasesUrl?: string
  reason?: string
  nextVersion?: string
  currentVersion?: string
  releaseNotes?: string
  downloadUrl?: string
  message?: string
  percent?: number
  transferred?: number
  total?: number
}

type GetWindowFn = () => BrowserWindow | null

let getMainWindow: GetWindowFn = () => null
let currentState: UpdaterState = {state: 'idle'}

function isPortableBuild(): boolean {
  return Boolean(process.env.PORTABLE_EXECUTABLE_DIR)
}

function isAppleDeveloperSigned(): boolean {
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

export function requiresManualInstall(): boolean {
  if (process.platform !== 'darwin') return false
  if (process.env.MEDIA_CHIPS_MAC_AUTO_INSTALL === '1') return false
  return !isAppleDeveloperSigned()
}

function getMacDmgUrl(version: string): string {
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  return `${RELEASES_BASE}/v${version}/MediaChips.v${version}.Mac.${arch}.dmg`
}

function isSignatureValidationError(message: unknown): boolean {
  const text = String(message || '')
  return /code signature/i.test(text) || /не удалось удовлетворить требован/i.test(text)
}

export function isUpdaterSupported(): boolean {
  if (!app.isPackaged) return false
  if (process.env.MEDIA_CHIPS_DISABLE_UPDATER === '1') return false
  if (isPortableBuild()) return false
  return true
}

function getDisabledReason(): string | null {
  if (isPortableBuild()) return 'portable'
  if (!app.isPackaged) return 'dev'
  if (process.env.MEDIA_CHIPS_DISABLE_UPDATER === '1') return 'disabled'
  return null
}

function sendStatus(payload: Partial<UpdaterState>): void {
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

function formatReleaseNotes(info: UpdateInfo | null | undefined): string {
  const notes = info?.releaseNotes
  if (!notes) return ''
  if (typeof notes === 'string') return notes
  if (Array.isArray(notes)) {
    return notes
      .map((note) => (typeof note === 'string' ? note : (note as { note?: string })?.note || ''))
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

function sendDownloadedStatus(info: UpdateInfo): void {
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

export function initAppUpdater({getWindow}: { getWindow: GetWindowFn }): void {
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

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
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

    autoUpdater.on('error', (error: Error) => {
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
      const message = error instanceof Error ? apiErrorMessage(error) : String(error)
      sendStatus({state: 'error', message})
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
      const message = error instanceof Error ? apiErrorMessage(error) : String(error)
      sendStatus({state: 'error', message})
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
