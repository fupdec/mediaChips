import useItemsStore from '@/stores/items'
import * as formatUtils from '@/services/formatUtils'
import {parseFilePath as parsePathTags} from '@/services/pathTagParser'
import {getWatchedFoldersExtensions} from '@/services/watcherUtils'
import {hideHoverImage, showHoverImage} from '@/services/hoverService'
import {getTabUrl, getUrlParam, checkCurrentPage} from '@/services/routeService'
import {getIconDataType, getTextDataType} from '@/services/metaTypeUtils'

/** Legacy facade for globalThis.$readable and app.config.globalProperties.$readable */
export function createReadableFacade({router, store, i18n} = {}) {
  return {
    ...formatUtils,

    checkCurrentPage(page) {
      return checkCurrentPage(router.currentRoute.value, page)
    },

    getTextDataType(type) {
      return getTextDataType(type, {
        te: i18n?.global?.te?.bind(i18n.global),
        t: i18n?.global?.t?.bind(i18n.global),
      })
    },

    getIconDataType,

    getUrlParam(param) {
      return getUrlParam(router.currentRoute.value, param)
    },

    getTabUrl,

    showHoverImage,
    hideHoverImage,

    parseFilePath(filePath, mediaId) {
      return parsePathTags(filePath, mediaId, {
        tags: store.tags,
        assigned: useItemsStore().assigned,
      })
    },

    getAverageColor(src) {
      return new Promise(resolve => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
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

export default {
  install(app, options = {}) {
    const {router, store, i18n} = options
    const readable = createReadableFacade({router, store, i18n})

    app.config.globalProperties.$readable = readable
    app.provide('readable', readable)
    globalThis.$readable = readable
  },
}
