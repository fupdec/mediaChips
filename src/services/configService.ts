import axios from 'axios'
import path from 'path-browserify'
import { resolveApiBaseUrl } from '@/utils/apiBaseUrl'
import { useAppStore } from '@/stores/app'
import { typedApi } from '@/services/typedApi'

interface AppConfigResponse {
  appVersion?: string
  path?: string
  databases?: unknown[]
  ip?: string
  port?: number | string
  [key: string]: unknown
}

export async function updateConfig(data: Record<string, unknown>) {
  return typedApi.updateConfig(data)
}

export async function initConfig() {
  const store = useAppStore()
  let config: AppConfigResponse | null = null

  try {
    const local = await axios.get<AppConfigResponse>('/config.json')
    config = local.data
  } catch (error) {
    console.error(error)
  }

  console.log(config)

  if (!config) {
    const remote = await axios.get<AppConfigResponse>(`${window.location.origin}/api/task/getConfig`)
    config = remote.data
  }

  store.localhost = resolveApiBaseUrl(config)
  store.appVersion = config.appVersion || store.appVersion
  store.dbPath = config.path || ''
  store.mediaPath = path.join(config.path || '', 'media')
  store.databases = config.databases || []
  store.config = config

  return config
}
