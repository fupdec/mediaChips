import { defineStore } from 'pinia'
import _ from 'lodash'
import type { WatchedFolderEntry } from '@/services/watcherUtils'

export const useWatcherStore = defineStore('watcher', {
  state: () => ({
    ws: null as WebSocket | null,
    busy: false,
    folders: [] as WatchedFolderEntry[],
    files: [] as unknown[],
    dialogFolder: false,
    folder: null as unknown,
  }),

  getters: {
    watchedFolders: (state) => state.folders.filter(folder => folder.watch),
  },

  actions: {},
})

export default useWatcherStore
