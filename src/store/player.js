const path = require("path")
const { ipcRenderer } = require('electron')

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: () => ({
    hoveredImage: false,
    hoveredImageId: '',
    hoveredImageType: '',
    hoveredImageTime: 0,
    hoveredImageX: 0,
    hoveredImageY: 0,
    x: 0,
    y: 0,
    pathToUserData: '',
    videoPlayerVideoId: null,
    videoPlayerPlaylist: null,
    videosDb: null,
    performersDb: null,
    tagsDb: null,
    websitesDb: null,
    playlistsDb: null,
    markersDb: null,
    bookmarksDb: null,
    settingsDb: null,
    fullscreen: false,
  }),
  getters: {
    getPathToUserData(state) {
      return path.join(state.pathToUserData, 'userfiles')
    },
  },
  mutations: {
  },
  actions: {
    getDb({state, dispatch}, dbType) {
      return new Promise((resolve) => {
        ipcRenderer.invoke('getDb', dbType)
        dispatch('getDbAnswer').then(database => {
          state[`${dbType}Db`] = database
          resolve(database)
        })
      })
    },
    getDbAnswer() {
      return new Promise((resolve) => {
        ipcRenderer.once('getDbAnswer', (event, database) => {
          resolve(database)
        })
      })
    },
  },
  modules: {
  }
})
