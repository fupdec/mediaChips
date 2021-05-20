const {app} = require('electron').remote
const path = require("path")
const rimraf = require("rimraf")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbMeta = path.join(app.getPath('userData'), 'userfiles/databases/meta.json')
const adapterMeta = new FileSync(pathToDbMeta)
const low = require('lowdb')
const dbMeta = low(adapterMeta)

import router from '@/router'

let defaultMeta = {
  id: "defaultMeta",
  type: 'complex',
  date: Date.now(),
  edit: Date.now(),
  settings: {
    name: "Tags",
    icon: 'tag-outline',
    cardSize: 1,
    metaInCard: [],
  },
}

let defaultMetaCard = {
  id: "defaultMetaCard",
  metaId: 'defaultMeta',
  date: Date.now(),
  edit: Date.now(),
  meta: {
    name: "Card",
  }
}

dbMeta.defaults({ meta: [], cards: [] }).write()

const Meta = {
  state: () => ({
    pageTotal: 1,
    filteredMeta: [],
    updateCardIds: [],
    dialogEditMetaCard: false,
    dialogEditMetaCardImages: false,
    dialogFilterMetaCards: false,
    selection: null,
    selectedMeta: [],
    filters: [],
    page: 1,
    sortBy: 'name',
    sortDirection: 'asc',
    metaList: dbMeta.get('meta').filter({type:'complex'}).value(),
  }),
  mutations: {
    updateMetaCards(state, ids) {
      if (ids === undefined) state.updateCardIds = []
      else state.updateCardIds = ids // TODO make update function
    },
    getMetaListFromDb(state) {
      state.metaList = _.cloneDeep(dbMeta.get('meta').filter({type:'complex'}).value())
    },
  },
  actions: {
    addComplexMeta({commit, getters, rootState}, metaObject) {
      let meta = { ...defaultMeta, ...metaObject }
      getters.meta.push(meta).write()
      getters.metaCards.set(meta.id, []).write()
      getters.savedFilters.set(meta.id, []).write()
      commit('getMetaListFromDb')
      commit('addLog', {type:'info', color:'green', text:`Added complex meta "${meta.settings.name}"`})
    },
    addSimpleMeta({commit, getters, rootState}, metaObject) {
      let meta = { ...defaultMeta, ...metaObject }
      getters.meta.push(meta).write()
      commit('addLog', {type:'info', color:'green', text:`Added simple meta "${metaObject.settings.name}"`})
    },
    deleteComplexMeta({commit, getters}, {id, name}) {
      let ids = getters.meta.filter(i=>_.some(i.settings.metaInCard,{id})).map('id').value()
      for (let i = 0; i < ids.length; i++) { // delete from meta cards
        getters.metaCards.filter({metaId:ids[i]}).each(card=>{card.meta[id]=undefined}).write() 
      }
      getters.meta.remove({id}).write() // delete from database
      getters.metaCards.remove({metaId:id}).write() // delete all cards from database
      getters.savedFilters.unset(id).write() // delete saved filters from database
      getters.meta.filter(i=>_.some(i.settings.metaInCard,{id})).each(i=>{ // setts
        i.settings.metaInCard=i.settings.metaInCard.filter(x=>x.id!=id)}).write()
      const metaFolder = path.join(getters.getPathToUserData, 'media', 'meta', id)
      rimraf(metaFolder, () => { /*console.log("done")*/ }) // remove folder with images
      commit('getMetaListFromDb')
      commit('addLog', {type:'info', color:'red', text:`Deleted complex meta "${name}"`})
    },
    deleteSimpleMeta({commit, getters}, {id, name}) {
      let ids = getters.meta.filter(i=>_.some(i.settings.metaInCard,{id})).map('id').value()
      for (let i = 0; i < ids.length; i++) { // delete from meta cards
        getters.metaCards.filter({metaId:ids[i]}).each(card=>{card.meta[id]=undefined}).write() 
      }
      getters.remove({id}).write() // delete from database
      getters.meta.filter(i=>_.some(i.settings.metaInCard,{id})) // delete from complex meta 
        .each(i=>{ i.settings.metaInCard=i.settings.metaInCard.filter(x=>x.id!=id)}).write()
      commit('addLog', {type:'info', color:'red', text:`Deleted simple meta "${name}"`})
    },
    addMetaCard({commit, getters}, newMetaCard) {
      let metaCard = { ...defaultMetaCard, ...newMetaCard }
      getters.metaCards.push(metaCard).write()
      // TODO change 'card' to meta name
      commit('addLog', {type:'info', color:'green', text:`Added card "${metaCard.meta.name}"`})
    },
    updateMetaSettings({getters}, {id, key, value}) {
      getters.meta.find({id}).get('settings').set(key, value).write()
    },
    filterMetaCards({ state, commit, dispatch, getters, rootState}, stayOnCurrentPage) {
      const metaId = router.currentRoute.query.metaId
      let mc = getters.metaCards.filter({metaId})
      mc = mc.orderBy(i=>(i.meta.name.toLowerCase()), ['asc'])

      function compare(sign, a, b) {
        if (b===undefined||b===null||b.length==0) return false
        if (sign === 'equal') return a == b
        if (sign === 'not equal') return a != b
        if (sign === 'greater than') return a < b
        if (sign === 'less than') return a > b
        if (sign === 'greater than or equal') return a <= b
        if (sign === 'less than or equal') return a >= b
      }

      let filters = state.filters
      for (let filter in filters) {
        let by = filters[filter].by
        let cond = filters[filter].cond
        let val = filters[filter].val
        let type = filters[filter].type
        let flag = filters[filter].flag
        
        if (type === 'boolean') {
          if (cond === 'yes') mc = mc.filter(c => c.meta[by]===true)
          else mc = mc.filter(c => !c.meta[by]===true)
          continue
        }

        if (type=='number'||type=='date'||type=='string') val = val.toLowerCase().trim()
        if ((val===null||val.length===0)&&(cond!='empty'&&cond!='not empty')) continue
        if (cond=='empty') {mc=mc.filter(c=>c.meta[by]===undefined||c.meta[by]===null||c.meta[by].length==0);continue} 
        if (cond=='not empty') {mc=mc.filter(c=>c.meta[by]!==undefined&&c.meta[by]!==null&&c.meta[by].length>0);continue}

        if (type === 'number' || type === 'date') {
          if (by === 'date') val = new Date(val).getTime()
          mc = mc.filter(c => compare(cond, val, c.meta[by]))
          continue
        }
        
        if (type === 'string') {
          if (cond=='includes') mc=mc.filter(c=>c.meta[by].toLowerCase().includes(val))
          else mc=mc.filter(c=>!c[by].toLowerCase().includes(val))
          continue
        }

        if (type === 'array' || type === 'select') {
          if (cond === 'includes all') mc = mc.filter(c=>{
            if (c.meta[by]===undefined) return false
            else return _.isEqual(c.meta[by].sort(), val.sort())
          })
          else if (cond === 'includes one of') mc = mc.filter(c=>_.difference(val, c.meta[by]).length===0)
          else if (cond === 'excludes') mc = mc.filter(c=>_.difference(val, c.meta[by]).length!==0)
        }
      }
      // sort meta
      let sortBy = state.sortBy || 'name'
      let sortDirection = state.sortDirection || 'asc'
      if (sortBy == 'name') mc = mc.orderBy(i=>(i.meta.name.toLowerCase()), [sortDirection])
      else if (['date','edit'].includes(sortBy)) mc = mc.orderBy(sortBy, [sortDirection])
      else mc = mc.orderBy(`meta.${sortBy}`, [sortDirection])

      state.filteredMeta = mc.value()
      
      if (!stayOnCurrentPage) state.page = 1
      dispatch('saveStateOfMeta')
    },
    saveStateOfMeta({state, commit, getters, rootState}) {
      const metaId = router.currentRoute.query.metaId
      const tabId = router.currentRoute.query.tabId
      const data = {
        filters: _.cloneDeep(state.filters),
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
        page:  state.page,
      }
      if (tabId === 'default') getters.meta.find({id:metaId}).assign(data).write()
      else { getters.tabsDb.find({id: tabId}).assign(data).write(); commit('getTabsFromDb') }
    },
  },
  getters: {
    dbMeta() {
      return dbMeta
    },
    meta(state, store) {
      return store.dbMeta.get('meta')
    },
    metaCards(state, store) {
      return store.dbMeta.get('cards')
    },
    complexMeta(state, store) {
      return store.dbMeta.get('meta').filter({type:'complex'})
    },
    simpleMeta(state, store) {
      return store.dbMeta.get('meta').filter({type:'simple'})
    },
    metaCardsOnPage(state, store, rootState) {
      const meta = state.filteredMeta,
            metaCount = 20 // rootState.Settings.metaPerPage
      state.pageTotal = Math.ceil(meta.length / metaCount)

      // if(rootState.Settings.metaPage > state.pageTotal) {
      //   rootState.Settings.metaPage = state.pageTotal
      // }
      const end = 1 * metaCount, start = end - metaCount // TODO fix it
      return meta.slice(start, end)
    },
    metaCardsPages(state) {
      let pages = []
      for (let i = 0; i < state.pageTotal; i++) pages.push(i+1)
      return pages
    },
  }
}

export default Meta