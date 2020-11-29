const {app} = require('electron').remote
const fs = require("fs")
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbSettings = path.join(app.getPath('userData'), 'userfiles/dbs.json')
const pathToDbWebsites = path.join(app.getPath('userData'), 'userfiles/databases/dbw.json')
const adapterSettings = new FileSync(pathToDbSettings)
const adapterWebsites = new FileSync(pathToDbWebsites)
const low = require('lowdb')
const dbs = low(adapterSettings)
const dbw = low(adapterWebsites)
dbw.defaults({
  websites: [{
    id: "defaultID",
    name: "Brazzers",
    color: "#ffc800",
    network: false,
    childWebsites: []
  },]
}).write()

const defaultFilters = {
  firstChar: [],
  colors: [],
  favorite: false,
  bookmark: false,
  name: '',
  sortBy: 'name',
  sortDirection: 'asc',
}

const Websites = {
  state: () => ({
    websitesPerPage: dbs.get('websitesPerPage').value(),
    pageCurrent: 1,
    pageTotal: 1,
    lastChanged: Date.now(),
    dialogDeleteWebsite: false,
    dialogEditWebsite: false,
    selection: null,
    selectedWebsites: [],
    updateInfo: {},
    updateImage: {},
    filters: _.cloneDeep(defaultFilters),
    filtersReserved: _.cloneDeep(defaultFilters),
    filteredWebsites: [],
    filteredEmpty: false,
    menuCard: false,
  }),
  mutations: {
    updateWebsites (state) {
      console.log(':::::::websites UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    changeWebsitesPerPage(state, quantity) {
      state.websitesPerPage = quantity
    },
    changeWebsitesPageTotal(state, quantity) {
      state.pageTotal = quantity
    },
    changeWebsitesPageCurrent(state, quantity) {
      state.pageCurrent = quantity
    },
    filterWebsites(state, filteredWebsites) {
      state.filteredWebsites = filteredWebsites
    },
    resetFilteredWebsites(state) {
      state.filters = _.cloneDeep(defaultFilters)
    },
    updateFiltersOfWebsites(state, {key, value}) {
      state.filters[key] = value
      // console.log(state.filters)
    },
    updateSelectedWebsites(state, ids) {
      state.selectedWebsites = ids
    },
  },
  actions: {
    changeWebsitesPerPage({ state, commit, getters}, quantity) {
      commit('updateWebsites')
      commit('changeWebsitesPerPage', quantity)
      getters.settings.set('websitesPerPage', quantity).write()
    },
    changeWebsitesPageTotal({ state, commit}, quantity) {
      commit('updateWebsites')
      commit('changeWebsitesPageTotal', quantity)
    },
    changeWebsitesPageCurrent({ state, commit}, quantity) {
      commit('updateWebsites')
      commit('changeWebsitesPageCurrent', quantity)
    },
    deleteWebsites({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedWebsites.map(id => {
        let websiteName = getters.websites.find({id:id}).value().name
        // remove website from videos
        getters.videos.filter({'website': websiteName}).each(video=>{
          video.website = ""
        }).write()
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
      })
      state.selectedWebsites = []
      commit('updateWebsites')
      dispatch('filterWebsites', true)
    },
    filterWebsites({ state, commit, getters}, stayOnCurrentPage) {
      let websites = getters.websites
      let filteredWebsites = []
      websites = websites.orderBy(website=>(website.name.toLowerCase()), ['asc'])
      if (state.filters.colors) {
        let colors = state.filters.colors
        if (colors.length) {
          websites = websites.filter(website => (colors.includes(website.color.toLowerCase())))
          // console.log('websites filtered by color')
        }
      }
      if (state.filters.firstChar) {
        let firstChars = state.filters.firstChar
        let chars = ['0123456789','a','b','c','d','e','f','g','h','i','j','k',
          'l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','!$@^&*\'+-_~']
        let allChars = []
        firstChars.forEach( char => { allChars.push(chars[char]) } )
        // console.log(allChars)
        if (allChars.length) {
          websites = websites.filter( website => {
            let charTag = website.name.charAt(0).toLowerCase()
            return allChars.includes(charTag)
          })
          // console.log(chars[firstChars])
          // console.log('websites filtered by first character')
        }
      }
      if (state.filters.name) {
        let frase = state.filters.name.toLowerCase().trim()
        if (frase.length) {
          websites = websites.filter(website => (website.name.toLowerCase().includes(frase)))
          // console.log(`websites filtered by frase "${frase}" in name`)
        }
      }
      if (state.filters.sortBy) {
        let sort = state.filters.sortBy
        let direction = state.filters.sortDirection
        if (sort === 'name') {
          websites = websites.orderBy(p=>(p.name.toLowerCase()), [direction])
        } else {
          websites = websites.orderBy(sort, [direction])
        }
        // console.log('websites sorted')
        // TODO: add correct sort for collors based on swatches array
      }
      if (state.filters.favorite) {
        websites = websites.filter(website=>(website.favorite))
        // console.log('websites with favorite')
      }
      if (state.filters.bookmark) {
        websites = websites.filter(website=>(website.bookmark))
        // console.log('websites with bookmark')
      }
      if (websites != getters.websites) {
        if (websites.value().length == 0) {
          state.filteredEmpty = true
          filteredWebsites = websites
        } else {
          state.filteredEmpty = false
          filteredWebsites = websites
        }
      }
      commit('filterWebsites', filteredWebsites)
      if (!stayOnCurrentPage) {
        commit('changeWebsitesPageCurrent', 1)
      }
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
    websitesFilters: (state, store) => {
      let filters = []
      if (state.filters.name) {
        filters.push('Name:' + state.filters.name)
      }
      if (state.filters.favorite) {
        filters.push('Fav.')
      }
      if (state.filters.bookmark) {
        filters.push('Book.')
      }
      if (state.filters.firstChar.length) {
        let chars = ['0-9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','#']
        chars = state.filters.firstChar.map((c)=>(chars[c]))
        let filterChars = 'Char.:'
        filterChars += chars.join(';')
        filters.push(filterChars)
      }
      if (filters.length) {
        return filters.join(', ')
      } else {
        return 'Websites'
      }
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
    websitesOnPage(state, store) {
      const websites = store.filteredWebsites.value(),
            websitesCount = store.websitesPerPage
      let l = store.websitesTotal,
          c = websitesCount
      state.pageTotal = Math.ceil(l/c)
      if(state.pageCurrent > state.pageTotal) {
        state.pageCurrent = state.pageTotal
      }
      
      const end = state.pageCurrent * websitesCount,
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
    websitesCurrentPage(state) {
      return state.pageCurrent
    },
    getSelectedWebsites(state) {
      return state.selectedWebsites
    },
  }
};

export default Websites