import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    is_app_ready: false,
    localhost: '',
    appVersion: '0.1.0',
    app_title: 'MediaChips',
    dbPath: '',
    mediaPath: '',
    databases: [],
    isElectron: null,
    isLocked: false,
    hover: {
      show: false,
      tagId: null,
      metaId: null,
      data_type: null,
      timeout: 0,
      delay: 0,
      x: 0,
      y: 0,
      previewWidth: 160,
      previewHeight: 160,
    },
    media: [],
    mediaTypes: [],
    meta: [],
    tags: [],
    playlists: [],
    tabs: [],
    filters: {
      visible: false,
      attached: true,
    },
    syncDarkModeOs: {
      matchMedia: false,
      func: null,
    },
    config: {},
    window: { focused: true },
    log: [],
  }),
  actions: {
    updateState(key, value) {
      this[key] = value
    },
    addLog({ text, type, color }) {
      this.log.push({ type, text, color, time: Date.now() })
    },

    // getters-as-actions (useful for stores without direct access to state)
    getTagById(id) {
      return this.tags.find(i => i.id === id)
    },
    getMetaById(id) {
      return this.meta.find(i => i.id === id)
    },
    getTagsByMetaId(id) {
      return this.tags.filter(i => i.metaId === id)
    },
  }
})

export default useAppStore
