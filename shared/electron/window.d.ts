import type {
  ElectronAppInfo,
  ElectronBridgeAPI,
  ElectronLegacyOs,
  ElectronOperableAPI,
  ElectronOsAPI,
  ElectronReadableAPI,
} from './ipc'

declare global {
  interface Window {
    electronAPI?: ElectronBridgeAPI
    $electronOperable?: ElectronOperableAPI
    operableAPI?: Pick<
      ElectronOperableAPI,
      'openPath' | 'checkFileExists' | 'deleteLocalFile' | 'createThumb' | 'setNotification'
    >
    readableAPI?: ElectronReadableAPI
    osAPI?: ElectronOsAPI
    appInfo?: ElectronAppInfo
    os?: ElectronLegacyOs
    showNotification?: (text: string, type: string) => void
  }
}

export {}
