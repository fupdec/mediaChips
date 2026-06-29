import { bootstrapApi } from './bootstrap'
import { authApi } from './auth'
import { homeApi } from './home'
import { mediaApi } from './media'
import { metaApi } from './meta'
import { pagesApi } from './pages'
import { tasksApi } from './tasks'
import { transcodeApi } from './transcode'

export const typedApi = {
  ...bootstrapApi,
  ...authApi,
  ...homeApi,
  ...pagesApi,
  ...mediaApi,
  ...metaApi,
  ...tasksApi,
  ...transcodeApi,
}

export type TypedApi = typeof typedApi
