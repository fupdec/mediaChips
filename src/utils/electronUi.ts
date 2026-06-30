function isElectronRenderer(): boolean {
  return navigator.userAgent.toLowerCase().includes(' electron/')
}

export function isRealWinElectron(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('windows') && isElectronRenderer()
}

export function isWinElectronUi(): boolean {
  return isRealWinElectron()
}
