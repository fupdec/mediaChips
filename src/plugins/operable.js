import * as fileService from '@/services/fileService'
import * as filterService from '@/services/filterService'
import {updateConfig, initConfig} from '@/services/configService'
import {showOpenDialog} from '@/services/electronDialogService'
import {getOption, setOption} from '@/services/settingsService'
import {setNotification} from '@/services/notificationService'
import {openPath} from '@/services/shellService'
import {getWatchedFolders} from '@/services/watcherService'

/** Legacy facade for globalThis.$operable and app.config.globalProperties.$operable */
export function createOperableFacade() {
  return {
    initConfig,
    checkFileExists: fileService.checkFileExists,
    getLocalImage: fileService.getLocalImage,
    updateConfig,
    createImage: fileService.createImage,
    deleteLocalFile: fileService.deleteLocalFile,
    createThumb: fileService.createThumb,
    getOption,
    showOpenDialog,
    setOption,
    openPath,
    getWatchedFolders,
    getSavedFilters: filterService.getSavedFilters,
    setNotification,
    getFilters: filterService.getFilters,
  }
}

export default {
  install(app) {
    const operable = createOperableFacade()

    app.config.globalProperties.$operable = operable
    app.provide('operable', operable)
    globalThis.$operable = operable
  },
}
