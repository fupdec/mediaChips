// TEMP: remove after verifying unified Windows header UI.
// Enables Windows Electron header layout/styles on any OS for local testing.

const DEBUG_STORAGE_KEY = 'debugWinElectronUi'

export function isDebugWinElectronUi() {
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
