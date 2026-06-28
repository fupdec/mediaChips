import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { useAppStore } from '@/stores/app'
import { resolveApiBaseUrl } from '@/utils/apiBaseUrl'
import type { AppState } from '@/types/stores'

type AppStoreLike = Pick<AppState, 'config' | 'localhost'>

export function getApiBaseUrl(appStore: AppStoreLike = useAppStore()) {
  return resolveApiBaseUrl(appStore.config) || appStore.localhost || ''
}

export function buildApiUrl(path: string, baseUrl = getApiBaseUrl()) {
  if (!path) return String(baseUrl || '').replace(/\/$/, '')

  if (/^https?:\/\//i.test(path)) return path

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const normalizedBase = String(baseUrl || '').replace(/\/$/, '')
  return `${normalizedBase}${normalizedPath}`
}

function withBaseUrl(url: string, config: AxiosRequestConfig = {}) {
  const baseUrl = config.baseURL ?? getApiBaseUrl()
  return buildApiUrl(url, baseUrl)
}

function resolveRequestConfig(
  urlOrConfig: string | AxiosRequestConfig,
  config: AxiosRequestConfig = {},
): AxiosRequestConfig {
  if (typeof urlOrConfig === 'string') {
    return {
      ...config,
      url: withBaseUrl(urlOrConfig, config),
    }
  }

  return {
    ...urlOrConfig,
    url: withBaseUrl(urlOrConfig.url || '', urlOrConfig),
  }
}

export const apiClient = {
  request<T = unknown>(
    urlOrConfig: string | AxiosRequestConfig,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    if (typeof urlOrConfig === 'string') {
      return axios.request<T>(resolveRequestConfig(urlOrConfig, config))
    }
    return axios.request<T>(resolveRequestConfig(urlOrConfig))
  },

  get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return axios.get<T>(withBaseUrl(url, config), config)
  },

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return axios.post<T>(withBaseUrl(url, config), data, config)
  },

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return axios.put<T>(withBaseUrl(url, config), data, config)
  },

  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return axios.delete<T>(withBaseUrl(url, config), config)
  },

  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return axios.patch<T>(withBaseUrl(url, config), data, config)
  },
}
