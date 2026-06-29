import { apiClient } from '../apiClient'
import {
  API_ROUTES,
  apiVideoPlayable,
  apiVideoTranscodeStream,
} from '@shared/api/routes'
import {
  LiveTranscodeStopSchema,
  PlayableInfoSchema,
  TranscodeCacheStatsSchema,
} from '@shared/schemas/transcode'
import { validated } from './validate'

export const transcodeApi = {
  getVideoPlayable(mediaId: number) {
    return apiClient.get(apiVideoPlayable(mediaId)).then((res) => ({
      ...res,
      data: validated(PlayableInfoSchema.parse, res.data),
    }))
  },

  stopLiveTranscodeStream(mediaId: number) {
    return apiClient.delete(apiVideoTranscodeStream(mediaId)).then((res) => ({
      ...res,
      data: validated(LiveTranscodeStopSchema.parse, res.data),
    }))
  },

  getTranscodeCacheStats() {
    return apiClient.get(API_ROUTES.transcodeCache).then((res) => ({
      ...res,
      data: validated(TranscodeCacheStatsSchema.parse, res.data),
    }))
  },

  clearTranscodeCache() {
    return apiClient.delete(API_ROUTES.transcodeCache).then((res) => ({
      ...res,
      data: validated(TranscodeCacheStatsSchema.parse, res.data),
    }))
  },
}
