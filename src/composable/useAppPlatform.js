import {useAppStore} from '@/stores/app'

export function detectAppPlatform(userAgent = navigator.userAgent.toLowerCase()) {
  return {
    isElectron: userAgent.includes(' electron/'),
    isMac: userAgent.includes('mac'),
    isWin: userAgent.includes('windows'),
  }
}

export function useAppPlatform() {
  const store = useAppStore()
  const platform = detectAppPlatform()

  store.isElectron = platform.isElectron

  return platform
}
