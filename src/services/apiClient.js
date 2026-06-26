import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {resolveApiBaseUrl} from '@/utils/apiBaseUrl'

export function getApiBaseUrl(appStore = useAppStore()) {
  return resolveApiBaseUrl(appStore.config) || appStore.localhost || ''
}

export function buildApiUrl(path, baseUrl = getApiBaseUrl()) {
  if (!path) return String(baseUrl || '').replace(/\/$/, '')

  if (/^https?:\/\//i.test(path)) return path

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const normalizedBase = String(baseUrl || '').replace(/\/$/, '')
  return `${normalizedBase}${normalizedPath}`
}

function withBaseUrl(url, config = {}) {
  const baseUrl = config.baseURL ?? getApiBaseUrl()
  return buildApiUrl(url, baseUrl)
}

function resolveRequestConfig(urlOrConfig, config) {
  if (typeof urlOrConfig === 'string') {
    return {
      ...config,
      url: withBaseUrl(urlOrConfig, config),
    }
  }

  return {
    ...urlOrConfig,
    url: withBaseUrl(urlOrConfig.url, urlOrConfig),
  }
}

export const apiClient = {
  request(urlOrConfig, config) {
    if (typeof urlOrConfig === 'string') {
      return axios.request(resolveRequestConfig(urlOrConfig, config))
    }
    return axios.request(resolveRequestConfig(urlOrConfig))
  },

  get(url, config) {
    return axios.get(withBaseUrl(url, config), config)
  },

  post(url, data, config) {
    return axios.post(withBaseUrl(url, config), data, config)
  },

  put(url, data, config) {
    return axios.put(withBaseUrl(url, config), data, config)
  },

  delete(url, config) {
    return axios.delete(withBaseUrl(url, config), config)
  },

  patch(url, data, config) {
    return axios.patch(withBaseUrl(url, config), data, config)
  },
}
