import _ from 'lodash'
import {useSettingsStore} from '@/stores/settings'
import {apiClient} from '@/services/apiClient'

export async function getOption(option) {
  return apiClient.get(`/api/Setting/${option}`)
}

export const setOption = _.debounce(async function setOption(value, option) {
  const settings = useSettingsStore()
  settings[option] = value
  return await apiClient.put(`/api/Setting/${option}`, {value})
}, 10)
