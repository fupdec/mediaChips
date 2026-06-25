import {defineStore} from 'pinia'
import axios from 'axios'
import useSettingsStore from './settings'
import {useAppStore} from './app'
import {useNotificationsStore} from './notifications'
import {resolveApiBaseUrl} from '@/utils/apiBaseUrl'

const LICENSE_API_BASE_URL = import.meta.env.VITE_LICENSE_API_URL || 'https://mediachips.app/wp-json/mediachips/v1/license'

const MACHINE_ID_PATHS = ['/api/getMachineId', '/api/Task/getMachineId']

function isValidMachineId(value) {
  if (typeof value !== 'string') return false

  const id = value.trim()
  if (id.length < 16 || id.length > 128) return false
  if (/[<]/.test(id)) return false

  return /^[a-f0-9-]+$/i.test(id)
}

function calculateActivations(data) {
  const fingerprints = [data.fingerprint_1, data.fingerprint_2, data.fingerprint_3]
  let count = 0

  for (const fingerprint of fingerprints) {
    if (fingerprint && fingerprint.length > 0) {
      count++
    }
  }

  return count
}

function getErrorMessage(error, fallback) {
  if (error.response?.status === 404) {
    const url = error.config?.url || ''
    if (url.includes('mediachips.app')) {
      return 'License service is unavailable (404). Check your internet connection.'
    }
    return 'Device ID service is unavailable (404). Restart the application and try again.'
  }

  return error.response?.data?.message || error.message || fallback
}

function collectMachineIdApiBases() {
  const appStore = useAppStore()
  const bases = new Set()

  const resolved = resolveApiBaseUrl(
    appStore.config || {},
    appStore.localhost ? {url: appStore.localhost} : null,
  )
  if (resolved) bases.add(resolved.replace(/\/$/, ''))

  if (appStore.localhost) {
    bases.add(appStore.localhost.replace(/\/$/, ''))
  }

  return [...bases]
}

async function fetchMachineIdViaElectron() {
  if (typeof window === 'undefined' || !window.electronAPI?.invoke) {
    return null
  }

  try {
    const id = await window.electronAPI.invoke('get-machine-id')
    return isValidMachineId(id) ? id.trim() : null
  } catch (error) {
    console.warn('Failed to fetch machine id via Electron IPC:', error.message)
    return null
  }
}

async function fetchMachineIdViaHttp() {
  const bases = collectMachineIdApiBases()
  if (bases.length === 0) return null

  for (const base of bases) {
    for (const machineIdPath of MACHINE_ID_PATHS) {
      try {
        const response = await axios.get(`${base}${machineIdPath}`)
        if (isValidMachineId(response.data)) {
          return response.data.trim()
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.warn(`Failed to fetch machine id from ${base}${machineIdPath}:`, error.message)
        }
      }
    }
  }

  return null
}

export const useRegistrationStore = defineStore('useRegistrationStore', {
  state: () => ({
    machineId: null,
    licenseApiBaseUrl: LICENSE_API_BASE_URL,
    _regInfoCache: null,
  }),
  actions: {
    async updateRegInfo(value) {
      try {
        const registration = typeof value === 'string' ? value : JSON.stringify(value)

        // Keep registration out of public config; persist it in app settings only.
        this._regInfoCache = JSON.parse(registration)
        useSettingsStore().registration = registration

        // Вызываем внешние методы если они существуют
        if (typeof $operable !== 'undefined' && $operable) {
          await $operable.setOption(registration, 'registration')
          await $operable.updateConfig({registration: ''})
        }

      } catch (error) {
        console.error('Failed to update registration info:', error)
        throw error
      }
    },

    async ensureMachineId() {
      if (this.machineId) return this.machineId

      const machineId = await fetchMachineIdViaElectron() || await fetchMachineIdViaHttp()
      if (!machineId) {
        throw new Error('Device id is not available')
      }

      this.machineId = machineId
      return this.machineId
    },

    async checkLicense(licenseCode) {
      const response = await axios.post(`${this.licenseApiBaseUrl}/check`, {
        license_code: licenseCode,
      })

      return response.data
    },

    async activateLicense(licenseCode, fingerprint) {
      const resolvedFingerprint = fingerprint || await this.ensureMachineId()

      const response = await axios.post(`${this.licenseApiBaseUrl}/activate`, {
        license_code: licenseCode,
        fingerprint: resolvedFingerprint,
      })

      return response.data
    },

    async deactivateLicense(licenseCode, fingerprint) {
      const resolvedFingerprint = fingerprint || await this.ensureMachineId()

      const response = await axios.post(`${this.licenseApiBaseUrl}/deactivate`, {
        license_code: licenseCode,
        fingerprint: resolvedFingerprint,
      })

      return response.data
    },

    /**
     * On startup: verify stored license key on the public license API.
     */
    async tryAutoRegisterOnStartup() {
      const info = this.regInfo
      if (!info || typeof info !== 'object' || !info.license_code) {
        return {success: true, skipped: true}
      }

      const licenseCode = info.license_code

      let machineId
      try {
        machineId = await this.ensureMachineId()
      } catch (error) {
        console.warn('Auto registration skipped: device id is not available')
        return {success: false, skipped: true, error: 'Device id is not available'}
      }

      try {
        const today = new Date().toISOString().substring(0, 10)
        const storedFingerprints = [info.fingerprint_1, info.fingerprint_2, info.fingerprint_3]
        const isAlreadyActivated = storedFingerprints.includes(machineId)
        const isExpired = today > info.license_expiry && info.license_expiry !== '0000-00-00'

        if (isAlreadyActivated && !isExpired) {
          return {success: true, skipped: true}
        }

        const checkData = await this.checkLicense(licenseCode)
        if (!checkData) {
          const error = `Key "${licenseCode}" not found`
          this._notifyAutoRegisterError(error)
          return {success: false, error}
        }

        const isKeyExpired = today > checkData.license_expiry && checkData.license_expiry !== '0000-00-00'
        if (isKeyExpired) {
          const error = 'This activation key has expired'
          this._notifyAutoRegisterError(error)
          return {success: false, error}
        }

        const activations = calculateActivations(checkData)
        const fingerprints = [checkData.fingerprint_1, checkData.fingerprint_2, checkData.fingerprint_3]
        const isDeviceRegistered = fingerprints.includes(machineId)

        if (activations >= 3 && !isDeviceRegistered) {
          const error = 'The number of activations has been exceeded'
          this._notifyAutoRegisterError(error)
          return {success: false, error}
        }

        const activateData = await this.activateLicense(licenseCode)

        if (activateData?.activated) {
          await this.updateRegInfo(activateData.license)
          return {success: true}
        }

        const error = activateData?.message || 'Registration failed'
        this._notifyAutoRegisterError(error)
        return {success: false, error}
      } catch (error) {
        console.error('Auto registration failed:', error)
        const errorText = getErrorMessage(error, 'An error occurred while activating the application')
        this._notifyAutoRegisterError(errorText)
        return {success: false, error: errorText}
      }
    },

    _notifyAutoRegisterError(text) {
      useNotificationsStore().setNotification({
        type: 'error',
        text,
      })
    },
  },
  getters: {
    regInfo: (state) => {
      try {
        // Если есть кэш, возвращаем его
        if (state._regInfoCache) {
          return state._regInfoCache
        }

        let registration = null

        // Пробуем получить из settings store
        try {
          const settingsStore = useSettingsStore()

          if (settingsStore.registration) {
            registration = settingsStore.registration
          }
        } catch (e) {
          console.warn('Failed to get registration from stores:', e.message)
        }

        // Если регистрация пустая или невалидная
        if (!registration || registration.length < 10) {
          return ''
        }

        try {
          const parsed = JSON.parse(registration)

          // Кэшируем результат
          state._regInfoCache = parsed
          return parsed

        } catch (parseError) {
          console.error('Registration parse error:', parseError)
          console.warn('Clearing invalid registration data')

          try {
            const settingsStore = useSettingsStore()
            settingsStore.registration = ''
          } catch (e) {
            // ignore
          }

          return ''
        }

      } catch (error) {
        console.error('regInfo getter error', error)
        return ''
      }
    },

    reg(state) {
      try {
        const info = this.regInfo
        if (!info || typeof info !== 'object' || Object.keys(info).length === 0) {
          return false
        }

        // Проверяем срок действия лицензии
        const today = new Date().toISOString().substring(0, 10)
        if (today > info.license_expiry) {
          return false
        }

        if (!state.machineId) {
          return false
        }

        const arr = [info.fingerprint_1, info.fingerprint_2, info.fingerprint_3]
        return arr.includes(state.machineId)

      } catch (error) {
        console.error('reg getter error:', error)
        return false
      }
    }
  }
})

export default useRegistrationStore
