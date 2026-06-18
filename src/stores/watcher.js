import {defineStore} from 'pinia'
import _ from 'lodash'

export const useWatcherStore = defineStore('watcher', {
  state: () => ({
    ws: null,
    busy: false,
    folders: [],
    files: [],
    dialogFolder: false,
    folder: null
  }),

  getters: {
    watchedFolders: (state) => state.folders.filter(folder => folder.watch)
  },

  actions: {}
})