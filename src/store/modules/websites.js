const {app} = require('electron').remote
const fs = require("fs")
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbWebsites = path.join(app.getPath('userData'), 'userfiles/databases/dbw.json')
const adapterWebsites = new FileSync(pathToDbWebsites)
const low = require('lowdb')
const dbw = low(adapterWebsites)

import router from '@/router'

dbw.defaults({
  websites: [{
    id: "defaultID",
    name: "Brazzers",
    color: "#FF9800",
    network: false,
    childWebsites: [],
    date: Date.now(),
    edit: Date.now(),
  },]
}).write()

const Websites = {
  state: () => ({
    pageTotal: 1,
    lastChanged: Date.now(),
    dialogDeleteWebsite: false,
    dialogEditWebsite: false,
    dialogFilterWebsites: false,
    selection: null,
    selectedWebsites: [],
    updateInfo: {},
    updateImage: {},
    filteredWebsites: [],
    filteredEmpty: false,
    menuCard: false,
  }),
  mutations: {
    updateWebsites (state) {
      console.log(':::::::websites UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    filterWebsites(state, filteredWebsites) {
      state.filteredWebsites = filteredWebsites
    },
    updateSelectedWebsites(state, ids) {
      state.selectedWebsites = ids
    },
  },
  actions: {
    changeWebsitesPerPage({ state, commit, getters, dispatch}, number) {
      // commit('updateWebsites')
      commit('resetLoading')
      dispatch('updateSettingsState', {key:'websitesPerPage', value:number})
    },
    async filterWebsites({state, commit, dispatch, getters, rootState}, stayOnCurrentPage) {
      let websites = getters.websites
      websites = websites.orderBy(website=>(website.name.toLowerCase()), ['asc'])

      if (rootState.Settings.websiteColor.length) { // filter by color
        websites = websites.filter(website => rootState.Settings.websiteColor.includes(website.color.toLowerCase()))
      }

      if (rootState.Settings.websiteFirstChar.length) { // filter by first character
        let chars = ['0123456789','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','!$@^&*\'+-_~']
        let allChars = []
        rootState.Settings.websiteFirstChar.forEach( char => { allChars.push(chars[char]) } )
        if (allChars.length) {
          websites = websites.filter( website => {
            let charWebsite = website.name.charAt(0).toLowerCase()
            return allChars.includes(charWebsite)
          })
        }
      }

      function compare(sign, a, b) {
        if (sign === 'equal') return a == b
        if (sign === 'not equal') return a != b
        if (sign === 'greater than') return a < b
        if (sign === 'less than') return a > b
        if (sign === 'greater than or equal') return a <= b
        if (sign === 'less than or equal') return a >= b
      }

      
      for (let filter in rootState.Settings.websiteFilters) {
        let param = rootState.Settings.websiteFilters[filter].param
        let cond = rootState.Settings.websiteFilters[filter].cond
        let val = rootState.Settings.websiteFilters[filter].val
        let type = rootState.Settings.websiteFilters[filter].type
        let flag = rootState.Settings.websiteFilters[filter].flag
        
        if (type === 'boolean') {
          if (cond === 'yes') {
            websites = websites.filter(website=>website[param]===true)
          } else websites = websites.filter(website=>website[param]===false)
        }
        
        if (val === null || val.length === 0) continue
        
        if (type === 'number' || type === 'date') {
          if (type === 'number') val = +val
          if (param === 'date' || param === 'edit') val = new Date(val).getTime()
          websites = websites.filter(website => compare(cond, val, website[param]))
        }
        
        if (type === 'string') {
          let string = val.toLowerCase().trim()
          if (string.length) {
            if (param === 'name' && flag === true) {
              let filteredByNames = await websites.filter(website => {
                if (cond === 'includes') {
                  return website.name.toLowerCase().includes(string)
                } else return !website.name.toLowerCase().includes(string)
              }).map('id').value()
  
              let filteredByAltNames = await websites.filter( website => {
                let altNames = website.altNames.map(p=>p.toLowerCase())
                let matches = altNames.filter(a=>{
                  if (cond === 'includes') {
                    return a.includes(string)
                  } else return !a.includes(string)
                })
                if (matches.length>0) {
                  return true
                } else { return false } 
              }).map('id').value()
  
              let mergedIds = _.union(filteredByNames, filteredByAltNames)
  
              websites = websites.filter(p=>(mergedIds.includes(p.id)))
            } else {
              if (cond === 'includes') {
                websites = websites.filter(website => website[param].toLowerCase().includes(string))
              } else websites = websites.filter(v => !v[param].toLowerCase().includes(string))
            }
          }
        }

        if (type === 'array') {
          if (cond === 'all') {
            websites = websites.filter({[param]: val})
          } else if (cond === 'one of') {
            websites = websites.filter(website=>{
              let include = false
              for (let i=0; i<val.length;i++) {
                if ( website[param].includes(val[i]) ) include = true
              }
              return include
            })
          } else if (cond === 'not') {
            websites = websites.filter(website=>{
              let include = false
              for (let i=0; i<val.length;i++) {
                if ( website[param].includes(val[i]) ) include = true
              }
              return !include
            })
          }
        }

        if (type === 'select') {
          if (cond === 'includes') {
            websites = websites.filter(website=>val.includes(website[param]))
          } else websites = websites.filter(website=>!val.includes(website[param]))
        }
      }
  
      // sort websites
      if (rootState.Settings.websiteSortBy === 'name') {
        websites = websites.orderBy(website=>website.name.toLowerCase(), [rootState.Settings.websiteSortDirection])
      } else {
        // TODO add correct sort for colors based on swatches array
        websites = websites.orderBy(rootState.Settings.websiteSortBy, [rootState.Settings.websiteSortDirection])
      }

      // TODO try to remove default websites and load always filtered websites without condition
      let filteredWebsites = []
      if (websites != getters.websites) {
        if (websites.value().length == 0) {
          state.filteredEmpty = true
          filteredWebsites = websites
        } else {
          state.filteredEmpty = false
          filteredWebsites = websites
        }
      }
      commit('resetLoading')
      commit('filterWebsites', filteredWebsites)
      if (!stayOnCurrentPage) {
        rootState.Settings.websitePage = 1
      }
      dispatch('saveFiltersOfWebsites')
    },
    saveFiltersOfWebsites({state, commit, getters, rootState}) {
      const route = router.currentRoute
      const newFilters = _.cloneDeep(rootState.Settings.websiteFilters)
      const sortBy = rootState.Settings.websiteSortBy
      const sortDirection = rootState.Settings.websiteSortDirection
      const page = rootState.Settings.websitePage
      const firstChar = rootState.Settings.websiteFirstChar
      const color = rootState.Settings.websiteColor

      if (route.query.tabId === 'default') { // for websites page (not for tab)
        getters.settings.set('websiteFilters', newFilters).write()
        getters.settings.set('websiteSortBy', sortBy).write()
        getters.settings.set('websiteSortDirection', sortDirection).write()
        getters.settings.set('websitePage', page).write()
        getters.settings.set('websiteFirstChar', firstChar).write()
        getters.settings.set('websiteColor', color).write()
      } else {  // for tab with websites 
        getters.tabsDb.find({id: route.query.tabId}).assign({
          name: getters.websiteFiltersForTabName,
          filters: newFilters,
          sortBy: sortBy,
          sortDirection: sortDirection,
          page: page,
          firstChar: firstChar,
          color: color,
        }).write()
        commit('getTabsFromDb')
      }
    },
    deleteWebsites({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedWebsites.map(id => {
        let websiteName = getters.websites.find({id:id}).value().name
        // remove website from videos
        getters.videos.filter({'websites': [websiteName]}).each(video=>{
          let index = video.websites.indexOf(websiteName)
          if (index !== -1) video.websites.splice(index, 1)
        }).write()
        // close tab with this website
        let tab = _.find(getters.tabs, {'id': id })
        if (tab) dispatch('closeTab', id)
        // remove website from database
        getters.websites.remove({ 'id': id }).write()
        // remove images of website
        let imgPath = path.join(getters.getPathToUserData, `/media/websites/${id}_.jpg`)
        fs.unlink(imgPath, (err) => {
          if (err) {
            console.log(`failed to delete image of website "${websiteName}". ${err}`);
          } else {
            console.log(`successfully deleted image of website "${websiteName}"`);                                
          }
        })
        // run update data function (in settings button with this function)
      })
      state.selectedWebsites = []
      commit('updateWebsites')
      dispatch('filterWebsites', true)
    },
  },
  getters: {
    dbw(state) {
      return state.lastChanged, dbw
    },
    websitesDataBase(state, store) {
      return store.dbw
    },
    websites(state, store) {
      return store.dbw.get('websites')
    },
    websitesNames(state, store) {
      return store.dbw.get('websites').map('name').value()
    },
    websitesNamesLower(state, store) {
      return store.dbw.get('websites').map(w=>w.name.toLowerCase()).value()
    },
    websiteFiltersForTabName: (state, store, rootState) => {
      let filters = []
      let equals = ['equal', 'including', 'all', 'one of']
      let notEquals = ['not equal', 'not', 'excluding']
      
      for (let filter in rootState.Settings.websiteFilters) {
        let param = rootState.Settings.websiteFilters[filter].param
        let cond = rootState.Settings.websiteFilters[filter].cond
        let val = rootState.Settings.websiteFilters[filter].val
        let type = rootState.Settings.websiteFilters[filter].type
        let flag = rootState.Settings.websiteFilters[filter].flag

        if (val === null || val.length === 0) continue
        
        if (equals.includes(cond)) cond = '='
        if (notEquals.includes(cond)) cond = '!='
        
        if (type === 'array') {
          let arr = param+' '+cond+' '
          arr += val.join(';')
          filters.push(arr)
        } else {
          filters.push(param+' '+cond+' '+val)
        }
      }
      // TODO show first char and color in tab name
      return 'Websites' + (filters.length ? ' with ': ' ') + filters.join(', ')
    },
    filteredWebsites(state, store) {
      let websites 
      if (state.filteredWebsites.length===0) {
        websites = store.websites
      } else {
        websites = state.filteredWebsites
      }
      return websites
    },
    filteredWebsitesTotal(state, store) {
      if (state.filteredWebsites.length==0) {
        return state.filteredWebsites.length
      } else {
        return state.filteredWebsites.value().length
      }
    },
    websitesTotal: (state, store) => {
      return store.websites.value().length
    },
    websitesOnPage(state, store, rootState) {
      const websites = store.filteredWebsites.value(),
            websitesCount = rootState.Settings.websitesPerPage
      state.pageTotal = Math.ceil(websites.length / websitesCount)

      if(rootState.Settings.websitePage > state.pageTotal) {
        rootState.Settings.websitePage = state.pageTotal
      }
      
      const end = rootState.Settings.websitePage * websitesCount,
            start = end - websitesCount
      return websites.slice(start, end)
    },
    websitesPerPage(state) {
      return state.websitesPerPage
    },
    websitesPagesSum(state) {
      return state.pageTotal
    },
    websitesPages(state, store) {
      let pages = []
      for (let i = 0; i < store.websitesPagesSum; i++) {
        pages.push(i+1)
      }
      return pages
    },
    getSelectedWebsites(state) {
      return state.selectedWebsites
    },
  }
};

export default Websites