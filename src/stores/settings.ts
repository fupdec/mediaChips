import { defineStore } from 'pinia'
import { defaultSettingsState, type SettingsState } from '@/types/settings'

export const useSettingsStore = defineStore('useSettingsStore', {
  state: (): SettingsState => defaultSettingsState(),
  actions: {
    updateMultiple(data: Partial<SettingsState>) {
      this.$patch(data)
    },
    updateState({ key, value }: { key: keyof SettingsState; value: SettingsState[keyof SettingsState] }) {
      if (key in this.$state) {
        this[key] = value
      } else {
        console.warn(`Key "${String(key)}" does not exist in settings store`)
      }
    },
  },
})

export default useSettingsStore
