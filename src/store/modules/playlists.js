const {app} = require('electron').remote
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbPlaylists = path.join(app.getPath('userData'), 'userfiles/databases/dbpl.json')
const adapterPlaylists = new FileSync(pathToDbPlaylists)
const low = require('lowdb')
const dbpl = low(adapterPlaylists)
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

const defaultFilters = {
  favorite: false,
  name: '',
  sortBy: 'name',
  sortDirection: 'asc',
  page: 1,
}

const Playlists = {
  state: () => ({
    pageCurrent: 1,
    pageTotal: 1,
    lastChanged: Date.now(),
    dialogDeletePlaylist: false,
    dialogEditPlaylist: false,
    selection: null,
    selectedPlaylists: [],
    filters: _.cloneDeep(defaultFilters),
    filtersReserved: _.cloneDeep(defaultFilters),
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
    resetFilteredPlaylists(state) {
      state.filters = _.cloneDeep(defaultFilters)
    },
    updateFiltersOfPlaylists(state, {key, value}) {
      state.filters[key] = value
    },
    updateSelectedPlaylists(state, ids) {
      state.selectedPlaylists = ids
    },
    updateStateValue(state, {key, value}) {
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
    changePlaylistsPageTotal({ state, commit}, number) {
      // commit('updatePlaylists')
      commit('updateStateValue', {key:'pageTotal', value:number})
    },
    changePlaylistsPageCurrent({ state, commit}, number) {
      // commit('updatePlaylists')
      commit('resetLoading')
      commit('updateStateValue', {key:'pageCurrent', value:number})
    },
    filterPlaylists({ state, commit, getters}, stayOnCurrentPage) {
      let playlists = getters.playlists
      let filteredPlaylists = []
      playlists = playlists.orderBy(playlist=>(playlist.name.toLowerCase()), ['asc'])
      if (state.filters.name) {
        let frase = state.filters.name.toLowerCase().trim()
        if (frase.length) {
          playlists = playlists.filter(playlist => (playlist.name.toLowerCase().includes(frase)))
          // console.log(`playlists filtered by frase "${frase}" in name`)
        }
      }
      if (state.filters.sortBy) {
        let sort = state.filters.sortBy
        let direction = state.filters.sortDirection
        if (sort === 'name') {
          playlists = playlists.orderBy(p=>(p.name.toLowerCase()), [direction])
        } else if (sort === 'videos') {
          playlists = playlists.orderBy(p=>(p.videos.length), [direction])
        } else {
          playlists = playlists.orderBy(sort, [direction])
        }
        // console.log('playlists sorted')
      }
      if (state.filters.favorite) {
        playlists = playlists.filter(playlist=>(playlist.favorite))
        // console.log('playlists with favorite')
      }
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
        state.filters.page = 1
        commit('updateStateValue', {key:'pageCurrent', value:1})
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
      let l = store.playlistsTotal,
          c = playlistsCount
      state.pageTotal = Math.ceil(l/c)
      if(state.filters.page) {
        state.pageCurrent = state.filters.page
      }
      if(state.pageCurrent > state.pageTotal) {
        state.pageCurrent = state.pageTotal
      }
      
      const end = state.pageCurrent * playlistsCount,
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
    playlistsCurrentPage(state) {
      return state.pageCurrent
    },
    getSelectedPlaylists(state) {
      return state.selectedPlaylists
    },
  }
}

export default Playlists