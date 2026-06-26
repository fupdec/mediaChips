import axios from 'axios'
import path from 'path-browserify'
import {resolveApiBaseUrl} from '@/utils/apiBaseUrl'
import {useAppStore} from '@/stores/app'
import {apiClient} from '@/services/apiClient'

export async function updateConfig(data) {
  return apiClient.post('/api/update-config', data)
}

export async function initConfig() {
  const store = useAppStore()
  let config = null

  try {
    const local = await axios.get('/config.json')
    config = local.data
  } catch (error) {
    console.error(error)
  }

  console.log(config)

  if (!config) {
    const remote = await axios.get(`${window.location.origin}/api/task/getConfig`)
    config = remote.data
  }

  store.localhost = resolveApiBaseUrl(config)
  store.appVersion = config.appVersion
  store.dbPath = config.path
  store.mediaPath = path.join(config.path, 'media')
  store.databases = config.databases
  store.config = config

  return config
}
