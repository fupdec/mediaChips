const path = require("path")

import Vue from 'vue'
import Vuex from 'vuex'
import Videos from './modules/videos.js'
import Performers from './modules/performers.js'
import Tags from './modules/tags.js'
import Websites from './modules/websites.js'
import Bookmarks from './modules/bookmarks.js'
import SavedFilters from './modules/savedFilters.js'
import Playlists from './modules/playlists.js'
import Markers from './modules/markers.js'
import Meta from './modules/meta.js'
import Settings from './modules/settings.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: () => ({
    itemsLoading: true,
    log: [],
    isLogVisible: false,
    notifications: [],
    isRouteChanged: false,
    quantityRecentVideos: 20,
    hoveredImage: false,
    hoveredImageId: '',
    hoveredImageType: '',
    hoveredImageTime: 0,
    hoveredImageX: 0,
    hoveredImageY: 0,
    x: 0,
    y: 0,
    pathToUserData: '',
    menuTabs: false,
    contextTab: '',
    videoPlayerVideoId: null,
    videoPlayerPlaylist: null,
    foldersData: [],
    dialogFolder: false,
    updateFoldersData: 0,
    backgroundProcesses: 0,
    swatches: ["#cc0e00","#ff5722","#ff9800","#8bc34a","#2ac530","#009688",
      "#00bcd4","#2196f3","#2041f7","#ae0eff","#e8004f","#795548","#9b9b9b",],
  }),
  getters: {
    getNotifications(state) {
      return state.notifications
    },
    getPathToUserData(state) {
      return path.join(state.pathToUserData, 'userfiles')
    },
  },
  mutations: {
    addLog(state, {text, type, color}) {
      state.log.push({
        type: type,
        text: text,
        color: color,
        time: Date.now(),
      })
    },
    setNotification(state, notification) {
      state.notifications.push({
        id: Math.ceil(Math.random()*new Date().getTime()),
        showing: true,
        type: notification.type,
        text: notification.text,
      })
    },
    removeNotification(state, id) {
      state.notifications = state.notifications.filter(n => n.id !== id)
    },
    clearAllNotifications(state) {
      state.notifications = []
    },
    changeQuantityRecentVideos(state, value) {
      state.quantityRecentVideos = value
    },
    stopLoading(state) {
      state.itemsLoading = false
    },
    resetLoading(state) {
      state.itemsLoading = true
    },
  },
  actions: {
    setNotification({ state, commit}, notification) {
      commit('setNotification', notification)
    },
    removeNotification({ state, commit}, id) {
      commit('removeNotification', id)
    },
    clearAllNotifications({ state, commit}) {
      commit('clearAllNotifications')
    },
    updateDataFromVideos({getters}) {
      console.log('update performer data')
      const videos = getters.videos
        // update performer data
      getters.performers.each(p=>{
        const vids = videos.filter(v=>v.performers.includes(p.name))
        p.videos = vids.value().length // write number of videos
        // get tags of videos
        let tagsAllVideos = vids.map('tags').value()
        let tags = []
        tagsAllVideos.map(vTags=>{ if (vTags.length>0) vTags.map(tag=>tags.push(tag)) })
        tags = tags.filter((x, i, a) => a.indexOf(x) === i) // get unique values
        tags = tags.filter(el => (el !== null && el !== undefined))
        p.videoTags = tags.sort((a, b) => a.localeCompare(b)) // write tags of videos
        // get websites of videos
        let websitesAllVideos = vids.map('websites').value()
        let websites = []
        websitesAllVideos.map(vWeb=>{ if (vWeb.length>0) vWeb.map(web=>websites.push(web)) })
        websites = websites.filter((x, i, a) => a.indexOf(x) === i) // get unique values
        websites = websites.filter(el => (el !== null && el !== undefined))
        p.websites = websites.sort((a, b) => a.localeCompare(b)) // write websites of videos
      }).write()

      // update tag data
      getters.tags.each(t=>{
        const vids = videos.filter(v=>v.tags.includes(t.name))
        t.videos = vids.value().length // write number of videos
        // get performers of tag
        let performers = getters.performers.filter({tags:[t.name]}).map('name').value()
        t.performers = performers.sort((a, b) => a.localeCompare(b)) // write performers of tag
      }).write()

      // update website data
      getters.websites.each(w=>{
        const vids = videos.filter(v=>v.websites.includes(w.name))
        w.videos = vids.value().length // write number of videos
        // get performers of videos
        let performersAllVideos = vids.map('performers').value()
        let performers = []
        performersAllVideos.map(perfs=>{ if (perfs.length>0) perfs.map(p=>performers.push(p)) })
        performers = performers.filter((x, i, a) => a.indexOf(x) === i) // get unique values
        performers = performers.filter(el => (el !== null && el !== undefined))
        w.performers = performers.sort((a, b) => a.localeCompare(b)) // write performers of videos
        // get tags of videos
        let tagsAllVideos = vids.map('tags').value()
        let tags = []
        tagsAllVideos.map(vTags=>{ if (vTags.length>0) vTags.map(tag=>tags.push(tag)) })
        tags = tags.filter((x, i, a) => a.indexOf(x) === i) // get unique values
        tags = tags.filter(el => (el !== null && el !== undefined))
        w.videoTags = tags.sort((a, b) => a.localeCompare(b)) // write tags of videos
      }).write()
    },
  },
  modules: {
    Videos,
    Performers,
    Tags,
    Websites,
    Bookmarks,
    SavedFilters,
    Playlists,
    Markers,
    Meta,
    Settings,
  }
})
