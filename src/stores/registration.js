import {defineStore} from 'pinia'
import axios from 'axios'
import useSettingsStore from './settings'
import {useNotificationsStore} from './notifications'

const LICENSE_API_BASE_URL = import.meta.env.VITE_LICENSE_API_URL || 'https://mediachips.app/wp-json/mediachips/v1/license'

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
  return error.response?.data?.message || error.message || fallback
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

    // Генерация machineId
    generateMachineId() {
      // Генерируем новый ID
      return 'mc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    },

    async checkLicense(licenseCode) {
      const response = await axios.post(`${this.licenseApiBaseUrl}/check`, {
        license_code: licenseCode,
      })

      return response.data
    },

    async activateLicense(licenseCode, fingerprint = this.machineId) {
      const response = await axios.post(`${this.licenseApiBaseUrl}/activate`, {
        license_code: licenseCode,
        fingerprint,
      })

      return response.data
    },

    async deactivateLicense(licenseCode, fingerprint = this.machineId) {
      const response = await axios.post(`${this.licenseApiBaseUrl}/deactivate`, {
        license_code: licenseCode,
        fingerprint,
      })

      return response.data
    },

    /**
     * On startup: verify stored license key on the public license API.
     */
    async tryAutoRegisterOnStartup() {
      if (this.reg) {
        return {success: true, skipped: true}
      }

      const info = this.regInfo
      if (!info || typeof info !== 'object' || !info.license_code) {
        return {success: true, skipped: true}
      }

      if (!this.machineId) {
        console.warn('Auto registration skipped: machineId is not available')
        return {success: false, skipped: true, error: 'Device id is not available'}
      }

      const licenseCode = info.license_code

      try {
        const checkData = await this.checkLicense(licenseCode)
        if (!checkData) {
          const error = `Key "${licenseCode}" not found`
          this._notifyAutoRegisterError(error)
          return {success: false, error}
        }

        const today = new Date().toISOString().substring(0, 10)
        const isKeyExpired = today > checkData.license_expiry && checkData.license_expiry !== '0000-00-00'
        if (isKeyExpired) {
          const error = 'This activation key has expired'
          this._notifyAutoRegisterError(error)
          return {success: false, error}
        }

        const activations = calculateActivations(checkData)
        const fingerprints = [checkData.fingerprint_1, checkData.fingerprint_2, checkData.fingerprint_3]
        const isDeviceRegistered = fingerprints.includes(this.machineId)

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

        // Инициализируем machineId если нужно
        if (!state.machineId) {
          // Теперь this доступен и можно вызвать generateMachineId
          this.machineId = this.generateMachineId()
        }

        // Проверяем привязку к устройству
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
