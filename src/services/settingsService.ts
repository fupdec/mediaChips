import _ from 'lodash'
import { useSettingsStore } from '@/stores/settings'
import { apiClient } from '@/services/apiClient'
import type { SettingsState } from '@/types/settings'

export async function getOption(option: keyof SettingsState | string) {
  return apiClient.get(`/api/Setting/${option}`)
}

export const setOption = _.debounce(async function setOption(
  value: SettingsState[keyof SettingsState],
  option: keyof SettingsState,
) {
  const settings = useSettingsStore()
  settings[option] = value
  return await apiClient.put(`/api/Setting/${option}`, { value })
}, 10)
