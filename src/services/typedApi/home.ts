import { apiClient } from '../apiClient'
import { API_ROUTES } from '@shared/api/routes'
import type { HomeMediaResponse } from '@shared/api/responses'
import type { AxiosRequestConfig } from 'axios'
import {
  parseExtendedStats,
  parseHomeHealth,
  parseHomeMarkers,
  parseHomeMediaResponse,
  parseHomeMediaStats,
  parseHomeTagCount,
  parseMediaThumbsResponse,
  parseMissingMediaStatus,
  parseSqlQueryMediaRows,
  parseSqlQueryTagRows,
  parseSuggestTagsResponse,
} from '@shared/schemas'
import { validated } from './validate'

export const homeApi = {
  getHomeMedia(params?: Record<string, unknown>) {
    return apiClient.get<HomeMediaResponse>(API_ROUTES.homeMedia, { params }).then((res) => ({
      ...res,
      data: validated(parseHomeMediaResponse, res.data),
    }))
  },

  getHomeExtendedStats() {
    return apiClient.get(API_ROUTES.homeExtendedStats).then((res) => ({
      ...res,
      data: validated(parseExtendedStats, res.data),
    }))
  },

  getMediaStats() {
    return apiClient.get(API_ROUTES.mediaGetStats).then((res) => ({
      ...res,
      data: validated(parseHomeMediaStats, res.data),
    }))
  },

  getTagCount() {
    return apiClient.get(API_ROUTES.tagCount).then((res) => ({
      ...res,
      data: validated(parseHomeTagCount, res.data),
    }))
  },

  getHomeMarkers(params?: Record<string, unknown>) {
    return apiClient.get(API_ROUTES.homeMarkers, { params }).then((res) => ({
      ...res,
      data: validated(parseHomeMarkers, res.data),
    }))
  },

  getHomeHealth() {
    return apiClient.get(API_ROUTES.homeHealth).then((res) => ({
      ...res,
      data: validated(parseHomeHealth, res.data),
    }))
  },

  getMissingMediaStatus() {
    return apiClient.get(API_ROUTES.taskMissingMediaStatus).then((res) => ({
      ...res,
      data: validated(parseMissingMediaStatus, res.data),
    }))
  },

  searchMedia(body: Record<string, unknown>, config?: AxiosRequestConfig) {
    return apiClient.post(API_ROUTES.mediaSearch, body, config).then((res) => ({
      ...res,
      data: validated(parseSqlQueryMediaRows, res.data),
    }))
  },

  searchTags(body: Record<string, unknown>, config?: AxiosRequestConfig) {
    return apiClient.post(API_ROUTES.tagSearch, body, config).then((res) => ({
      ...res,
      data: validated(parseSqlQueryTagRows, res.data),
    }))
  },

  postMediaThumbs(body: Record<string, unknown>, capitalized = false) {
    const route = capitalized ? API_ROUTES.mediaThumbsCapital : API_ROUTES.mediaThumbs
    return apiClient.post(route, body).then((res) => ({
      ...res,
      data: validated(parseMediaThumbsResponse, res.data),
    }))
  },

  suggestTagsFromPaths(body: Record<string, unknown>) {
    return apiClient.post(API_ROUTES.taskSuggestTagsFromPaths, body).then((res) => ({
      ...res,
      data: validated(parseSuggestTagsResponse, res.data),
    }))
  },
}
