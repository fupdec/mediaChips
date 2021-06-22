const {app} = require('electron').remote
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbPlaylists = path.join(app.getPath('userData'), 'userfiles/databases/dbpl.json')
const adapterPlaylists = new FileSync(pathToDbPlaylists)
const low = require('lowdb')
const dbpl = low(adapterPlaylists)

import router from '@/router'

let defaultPlaylist = {
  id: "123123123",
  name: "Watch later",
  videos: [],
  date: Date.now(),
  edit: Date.now(),
  favorite: false,
}

dbpl.defaults({ playlists: [{ ...defaultPlaylist }] }).write()

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
  }),
  mutations: {
    updatePlaylists(state) {
      console.log(':::::::playlists UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    updateSelectedPlaylists(state, ids) { state.selectedPlaylists = ids },
    updatePlaylistsStateValue(state, {key, value}) { state[key] = value },
  },
  actions: {
    updatePlaylistVideos({state, rootState, commit, dispatch, getters}, {id, videos}) {
      getters.playlists.find({id: id}).assign({videos: videos}).write()
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
        if (b===undefined||b===null||b.length==0) return false
        if (sign === 'equal') return a == b
        if (sign === 'not equal') return a != b
        if (sign === 'greater than') return a < b
        if (sign === 'less than') return a > b
        if (sign === 'greater than or equal') return a <= b
        if (sign === 'less than or equal') return a >= b
      }

      let filters = rootState.Settings.playlistFilters
      for (let filter in filters) {
        let by = filters[filter].by
        let cond = filters[filter].cond
        let val = filters[filter].val
        let type = filters[filter].type
        let flag = filters[filter].flag
        
        if (type === 'boolean') {
          if (cond === 'yes') playlists = playlists.filter(c => c[by]===true)
          else playlists = playlists.filter(c => !c[by]===true)
          continue
        }
        
        if (type=='number'||type=='date'||type=='string') val = val.toLowerCase().trim()
        if ((val===null||val.length===0)&&(cond!='empty'&&cond!='not empty')) continue
        if (cond=='empty') {playlists=playlists.filter(c=>c[by]===undefined||c[by]===null||c[by].length==0);continue} 
        if (cond=='not empty') {playlists=playlists.filter(c=>c[by]!==undefined&&c[by]!==null&&c[by].length>0);continue}

        if (type === 'number' || type === 'date') {
          if (by==='date' || by==='edit') val = new Date(val).getTime()
          playlists = playlists.filter(c => compare(cond, val, c[by]))
          continue
        }
        
        if (type === 'string') {
          if (cond=='includes') playlists=playlists.filter(c=>{
            let playlistsMeta = c[by]
            if (playlistsMeta) return playlistsMeta.toLowerCase().includes(val)
            else return false
          })
          else playlists=playlists.filter(c=>{
            let playlistsMeta = c[by]
            if (playlistsMeta) return !playlistsMeta.toLowerCase().includes(val)
            else return true
          })
          continue
        }
      }
  
      // sort playlists
      if (rootState.Settings.playlistSortBy === 'name') {
        playlists = playlists.orderBy(playlist=>playlist.name.toLowerCase(), [rootState.Settings.playlistSortDirection])
      } else {
        playlists = playlists.orderBy(rootState.Settings.playlistSortBy, [rootState.Settings.playlistSortDirection])
      }
      
      commit('resetLoading')
      state.filteredPlaylists = playlists.value()
      if (!stayOnCurrentPage) rootState.Settings.playlistPage = 1
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
    addPlaylist({state, rootState, commit, dispatch, getters}, { id, name }) {
      let playlist = { ...defaultPlaylist, ...{ id, name } }
      getters.playlists.push(playlist).write()
      commit('addLog', {type:'info', color:'green', text:`📃 Added playlist "${name}"`})
    },
    deletePlaylists({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedPlaylists.map(id => {
        let playlist = getters.playlists.find({id:id}).value().name
        commit('addLog', {type:'info',color:'red',text:`📃 Playlist "${playlist}" has been removed 🗑️`})
        getters.playlists.remove({ id: id }).write()
      })
      commit('updateSelectedPlaylists', [])
      dispatch('filterPlaylists', true)
    },
  },
  getters: {
    dbpl(state) { return state.lastChanged, dbpl },
    playlists(state, store) { return store.dbpl.get('playlists') },
    playlistsDatabase(state, store) { return store.dbpl },
    playlistFiltersForTabName: (state, store, rootState, getters) => {
      let filters = []
      let equals = ['equal', 'including', 'all', 'one of']
      let notEquals = ['not equal', 'not', 'excluding']
      
      for (let filter in rootState.Settings.playlistFilters) {
        let by = rootState.Settings.playlistFilters[filter].by
        let cond = rootState.Settings.playlistFilters[filter].cond
        let val = rootState.Settings.playlistFilters[filter].val
        let type = rootState.Settings.playlistFilters[filter].type
        let flag = rootState.Settings.playlistFilters[filter].flag

        let metaBy = getters.meta.find({id:by}).value()
        if (metaBy) by = metaBy.settings.name

        if (val === null || val.length === 0) continue
        
        if (equals.includes(cond)) cond = '='
        if (notEquals.includes(cond)) cond = '!='
        
        if (type === 'array' || type === 'select') {
          if (type === 'select') val = val.map(id=>getters.metaCards.find({id}).value().meta.name)
          if (type === 'array') val = val.map(id=>_.find(metaBy.settings.items, {id}).name)
          let arr = `"${by}" ${cond}`
          arr = `${arr} "${val.join(', ')}"` 
          filters.push(arr)
        } else filters.push(`"${by}" ${cond} "${val}"`)
      }
      return 'Playlists' + (filters.length ? ' with ': ' ') + filters.join('; ')
    },
    playlistsOnPage(state, store, rootState) {
      const playlists = state.filteredPlaylists,
            playlistsCount = rootState.Settings.playlistsPerPage
      state.pageTotal = Math.ceil(playlists.length / playlistsCount)

      if (rootState.Settings.playlistPage > state.pageTotal) rootState.Settings.playlistPage = state.pageTotal
      if (rootState.Settings.playlistPage == 0) rootState.Settings.playlistPage = 1
      
      const end = rootState.Settings.playlistPage * playlistsCount,
            start = end - playlistsCount
      return playlists.slice(start, end)
    },
    playlistsPagesSum(state) { return state.pageTotal },
    playlistsPages(state) {
      let pages = []
      for (let i = 0; i < state.pageTotal; i++) pages.push(i+1)
      return pages
    },
    getSelectedPlaylists(state) { return state.selectedPlaylists },
  }
}

export default Playlists