import { defineStore } from 'pinia'
import type { WatchedFolderEntry } from '@/services/watcherUtils'
import type { WatcherFilesEntry, WatcherFolderState } from '@/types/watcher'

export const useWatcherStore = defineStore('watcher', {
  state: () => ({
    ws: null as WebSocket | null,
    busy: false,
    folders: [] as WatchedFolderEntry[],
    files: [] as WatcherFilesEntry[],
    dialogFolder: false,
    folder: null as WatcherFolderState | null,
  }),

  getters: {
    watchedFolders: (state) => state.folders.filter(folder => folder.watch),
  },

  actions: {},
})

export default useWatcherStore
