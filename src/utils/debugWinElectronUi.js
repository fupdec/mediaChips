// TEMP: remove after verifying unified Windows header UI.
// Enables Windows Electron header layout/styles on any OS for local testing.

const DEBUG_STORAGE_KEY = 'debugWinElectronUi'

// TEMP: enabled by default in Electron while debugging header UI. Set to false when done.
export const TEMP_FORCE_WIN_ELECTRON_UI = true

function isElectronRenderer() {
  return navigator.userAgent.toLowerCase().includes(' electron/')
}

export function isDebugWinElectronUi() {
  if (TEMP_FORCE_WIN_ELECTRON_UI && isElectronRenderer()) {
    return true
  }

  if (import.meta.env.VITE_DEBUG_WIN_ELECTRON_UI === '1') {
    return true
  }

  try {
    return localStorage.getItem(DEBUG_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function isRealWinElectron() {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('windows') && ua.includes(' electron/')
}

export function isWinElectronUi() {
  return isRealWinElectron() || isDebugWinElectronUi()
}
