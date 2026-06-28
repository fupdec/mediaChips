import type { App } from 'vue'
import type { Router } from 'vue-router'
import { useItemsStore } from '@/stores/items'
import type { useAppStore } from '@/stores/app'
import * as formatUtils from '@/services/formatUtils'
import { parseFilePath as parsePathTags } from '@/services/pathTagParser'
import { getWatchedFoldersExtensions } from '@/services/watcherUtils'
import { hideHoverImage, showHoverImage } from '@/services/hoverService'
import { getTabUrl, getUrlParam, checkCurrentPage } from '@/services/routeService'
import { getIconDataType, getTextDataType } from '@/services/metaTypeUtils'

type AppStore = ReturnType<typeof useAppStore>

interface ReadableI18n {
  global: {
    te?: (key: string) => boolean
    t?: (key: string) => string
  }
}

interface ReadableFacadeOptions {
  router?: Router
  store?: AppStore
  i18n?: ReadableI18n
}

/** Legacy facade for globalThis.$readable and app.config.globalProperties.$readable */
export function createReadableFacade({ router, store, i18n }: ReadableFacadeOptions = {}) {
  return {
    ...formatUtils,

    checkCurrentPage(page: string) {
      return checkCurrentPage(router!.currentRoute.value, page)
    },

    getTextDataType(type: string) {
      return getTextDataType(type, {
        te: i18n?.global?.te?.bind(i18n.global),
        t: i18n?.global?.t?.bind(i18n.global),
      })
    },

    getIconDataType,

    getUrlParam(param: string) {
      return getUrlParam(router!.currentRoute.value, param)
    },

    getTabUrl,

    showHoverImage,
    hideHoverImage,

    parseFilePath(filePath: string, mediaId: number) {
      return parsePathTags(filePath, mediaId, {
        tags: store!.tags,
        assigned: useItemsStore().assigned,
      })
    },

    getAverageColor(src: string) {
      return new Promise<string>((resolve) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve('')
          return
        }
        const img = new Image()
        img.src = src
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 1, 1)
          const d = ctx.getImageData(0, 0, 1, 1).data
          resolve(`rgb(${d[0]},${d[1]},${d[2]})`)
        }
      })
    },

    getWatchedFoldersExtensions,
  }
}

export type ReadableFacade = ReturnType<typeof createReadableFacade>

interface ReadablePluginOptions {
  router: Router
  store: AppStore
  i18n: ReadableI18n
}

const readablePlugin = {
  install(app: App, options: ReadablePluginOptions) {
    const { router, store, i18n } = options
    const readable = createReadableFacade({ router, store, i18n })

    app.config.globalProperties.$readable = readable
    app.provide('readable', readable)
    globalThis.$readable = readable
  },
}

export default readablePlugin

declare module 'vue' {
  interface ComponentCustomProperties {
    $readable: ReadableFacade
  }
}

declare global {
  var $readable: ReadableFacade
}
