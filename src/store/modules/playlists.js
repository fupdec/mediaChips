const {app} = require('electron').remote
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbPlaylists = path.join(app.getPath('userData'), 'userfiles/databases/dbpl.json')
const adapterPlaylists = new FileSync(pathToDbPlaylists)
const low = require('lowdb')
const dbpl = low(adapterPlaylists)

import router from '@/router'

dbpl.defaults({
  playlists: [{
    id: "123123123",
    name: "Watch later",
    videos: [],
    date: Date.now(),
    edit: Date.now(),
    favorite: false,
  }],
}).write()

const Playlists = {
  state: () => ({
    pageCurrent: 1,
    pageTotal: 1,
    lastChanged: Date.now(),
    dialogDeletePlaylist: false,
    dialogEditPlaylist: false,
    dialogFilterPlaylists: false,
    selection: null,
    selectedPlaylists: [],
    filteredPlaylists: [],
    filteredEmpty: false,
    menuCard: false,
  }),
  mutations: {
    addPlaylist(state, playlist) {
      state.playlists.push(playlist)
    },
    updatePlaylists(state) {
      console.log(':::::::playlists UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    filterPlaylists(state, filteredPlaylists) {
      state.filteredPlaylists = filteredPlaylists
    },
    updateSelectedPlaylists(state, ids) {
      state.selectedPlaylists = ids
    },
    updatePlaylistsStateValue(state, {key, value}) {
      state[key] = value
    },
  },
  actions: {
    addPlaylist({ state, commit, getters}, playlist) {
      getters.playlists.push(playlist).write()
      commit('addPlaylist', playlist)
    },
    updatePlaylistVideos({state, rootState, commit, dispatch, getters}, {id, videos}) {
      getters.playlists.find({id: id}).assign({videos: videos}).write()
      state.playlists = _.cloneDeep(getters.playlists.value())
    },
    deletePlaylist({ state, commit, getters}, playlistName) {
      getters.playlists.remove({ name: playlistName }).write()
      state.playlists = _.cloneDeep(getters.playlists.value())
    },
    updatePlaylistName({ state, commit, getters}, {oldName, newName}) {
      getters.playlists.find({name:oldName}).assign({name:newName}).write()
      state.playlists = _.cloneDeep(getters.playlists.value())
    },
    changePlaylistsPerPage({ state, commit, getters, dispatch}, number) {
      // commit('updatePlaylists')
      commit('resetLoading')
      dispatch('updateSettingsState', {key:'playlistsPerPage', value:number})
    },
    async filterPlaylists({state, commit, dispatch, getters, rootState}, stayOnCurrentPage) {
      let playlists = getters.playlists
      playlists = playlists.orderBy(playlist => playlist.name.toLowerCase(), ['asc'])

      function compare(sign, a, b) {
        if (sign === 'equal') return a == b
        if (sign === 'not equal') return a != b
        if (sign === 'greater than') return a < b
        if (sign === 'less than') return a > b
        if (sign === 'greater than or equal') return a <= b
        if (sign === 'less than or equal') return a >= b
      }

      
      for (let filter in rootState.Settings.playlistFilters) {
        let param = rootState.Settings.playlistFilters[filter].param
        let cond = rootState.Settings.playlistFilters[filter].cond
        let val = rootState.Settings.playlistFilters[filter].val
        let type = rootState.Settings.playlistFilters[filter].type
        let flag = rootState.Settings.playlistFilters[filter].flag
        
        if (type === 'boolean') {
          if (cond === 'yes') {
            playlists = playlists.filter(playlist=>playlist[param]===true)
          } else playlists = playlists.filter(playlist=>playlist[param]===false)
        }
        
        if (val === null || val.length === 0) continue
        
        if (type === 'number' || type === 'date') {
          if (type === 'number') val = +val
          if (param === 'date' || param === 'edit') val = new Date(val).getTime()
          playlists = playlists.filter(playlist => compare(cond, val, playlist[param]))
        }
        
        if (type === 'string') {
          let string = val.toLowerCase().trim()
          if (string.length) {
            if (cond === 'includes') {
              playlists = playlists.filter(playlist => playlist[param].toLowerCase().includes(string))
            } else playlists = playlists.filter(v => !v[param].toLowerCase().includes(string))
          }
        }

        if (type === 'array') {
          if (cond === 'all') {
            playlists = playlists.filter({[param]: val})
          } else if (cond === 'one of') {
            playlists = playlists.filter(playlist=>{
              let include = false
              for (let i=0; i<val.length;i++) {
                if ( playlist[param].includes(val[i]) ) include = true
              }
              return include
            })
          } else if (cond === 'not') {
            playlists = playlists.filter(playlist=>{
              let include = false
              for (let i=0; i<val.length;i++) {
                if ( playlist[param].includes(val[i]) ) include = true
              }
              return !include
            })
          }
        }

        if (type === 'select') {
          if (cond === 'includes') {
            playlists = playlists.filter(playlist=>val.includes(playlist[param]))
          } else playlists = playlists.filter(playlist=>!val.includes(playlist[param]))
        }
      }
  
      // sort playlists
      if (rootState.Settings.playlistSortBy === 'name') {
        playlists = playlists.orderBy(playlist=>playlist.name.toLowerCase(), [rootState.Settings.playlistSortDirection])
      } else {
        playlists = playlists.orderBy(rootState.Settings.playlistSortBy, [rootState.Settings.playlistSortDirection])
      }

      let filteredPlaylists = []
      if (playlists != getters.playlists) {
        if (playlists.value().length == 0) {
          state.filteredEmpty = true
          filteredPlaylists = playlists
        } else {
          state.filteredEmpty = false
          filteredPlaylists = playlists
        }
      }
      commit('resetLoading')
      commit('filterPlaylists', filteredPlaylists)
      if (!stayOnCurrentPage) {
        rootState.Settings.playlistPage = 1
      }
      dispatch('saveFiltersOfPlaylists')
    },
    saveFiltersOfPlaylists({state, commit, getters, rootState}) {
      const route = router.currentRoute
      const newFilters = _.cloneDeep(rootState.Settings.playlistFilters)
      const sortBy = rootState.Settings.playlistSortBy
      const sortDirection = rootState.Settings.playlistSortDirection
      const page = rootState.Settings.playlistPage

      if (route.query.tabId === 'default') { // for playlists page (not for tab)
        getters.settings.set('playlistFilters', newFilters).write()
        getters.settings.set('playlistSortBy', sortBy).write()
        getters.settings.set('playlistSortDirection', sortDirection).write()
        getters.settings.set('playlistPage', page).write()
      } else {  // for tab with playlists 
        getters.tabsDb.find({id: +route.query.tabId}).assign({
          name: getters.playlistFiltersForTabName,
          filters: newFilters,
          sortBy: sortBy,
          sortDirection: sortDirection,
          page: page,
        }).write()
        commit('getTabsFromDb')
      }
    },
    deletePlaylists({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedPlaylists.map(id => {
        getters.playlists.remove({ id: id }).write()
      })
      commit('updateSelectedPlaylists', [])
      commit('updatePlaylists')
      dispatch('filterPlaylists', true)
    },
  },
  getters: {
    dbpl(state) {
      return state.lastChanged, dbpl
    },
    playlists(state, store) {
      return store.dbpl.get('playlists')
    },
    playlistsDatabase(state, store) {
      return store.dbpl
    },
    playlistFiltersForTabName: (state, store, rootState) => {
      let filters = []
      let equals = ['equal', 'including', 'all', 'one of']
      let notEquals = ['not equal', 'not', 'excluding']
      
      for (let filter in rootState.Settings.playlistFilters) {
        let param = rootState.Settings.playlistFilters[filter].param
        let cond = rootState.Settings.playlistFilters[filter].cond
        let val = rootState.Settings.playlistFilters[filter].val
        let type = rootState.Settings.playlistFilters[filter].type
        let flag = rootState.Settings.playlistFilters[filter].flag

        if (val === null || val.length === 0) continue
        
        if (equals.includes(cond)) cond = '='
        if (notEquals.includes(cond)) cond = '!='
        
        if (type === 'array') {
          let arr = `"${param}" ${cond}`
          arr = `${arr} "${val.join(',')}"` 
          filters.push(arr)
        } else {
          filters.push(`"${param}" ${cond} "${val}"`)
        }
      }
      return 'Playlists' + (filters.length ? ' with ': ' ') + filters.join('; ')
    },
    filteredPlaylists(state, store) {
      let playlists 
      if (state.filteredPlaylists.length===0) {
        playlists = store.playlists
      } else {
        playlists = state.filteredPlaylists
      }
      return playlists
    },
    filteredPlaylistsTotal(state, store) {
      if (state.filteredPlaylists.length==0) {
        return state.filteredPlaylists.length
      } else {
        return state.filteredPlaylists.value().length
      }
    },
    playlistsTotal: (state, store) => {
      return store.playlists.value().length
    },
    playlistsOnPage(state, store, rootState) {
      const playlists = store.filteredPlaylists.value(),
            playlistsCount = rootState.Settings.playlistsPerPage
      state.pageTotal = Math.ceil(playlists.length / playlistsCount)

      if (rootState.Settings.playlistPage > state.pageTotal) {
        rootState.Settings.playlistPage = state.pageTotal
      }
      
      const end = rootState.Settings.playlistPage * playlistsCount,
            start = end - playlistsCount
      return playlists.slice(start, end)
    },
    playlistsPagesSum(state) {
      return state.pageTotal
    },
    playlistsPages(state) {
      let pages = []
      for (let i = 0; i < state.pageTotal; i++) {
        pages.push(i+1)
      }
      return pages
    },
    getSelectedPlaylists(state) {
      return state.selectedPlaylists
    },
  }
}

export default Playlists