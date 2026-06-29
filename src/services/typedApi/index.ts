import { bootstrapApi } from './bootstrap'
import { homeApi } from './home'
import { mediaApi } from './media'
import { metaApi } from './meta'
import { pagesApi } from './pages'
import { tasksApi } from './tasks'

export const typedApi = {
  ...bootstrapApi,
  ...homeApi,
  ...pagesApi,
  ...mediaApi,
  ...metaApi,
  ...tasksApi,
}

export type TypedApi = typeof typedApi
