const {app} = require('electron').remote
const fs = require("fs")
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

const specificMeta = [
  {
    "id": "path",
    "type": "specific",
    "settings": {
      "name": "File path",
      "icon": "file-search"
    }
  },
  {
    "id": "favorite",
    "type": "specific",
    "settings": {
      "name": "Favorite",
      "icon": "heart"
    }
  },
  {
    "id": "rating",
    "type": "specific",
    "settings": {
      "name": "Rating",
      "icon": "star"
    }
  },
  {
    "id": "bookmark",
    "type": "specific",
    "settings": {
      "name": "Bookmark",
      "icon": "bookmark"
    }
  },
  {
    "id": "color",
    "type": "specific",
    "settings": {
      "name": "Color",
      "icon": "palette"
    }
  },
  {
    "id": "name",
    "type": "specific",
    "settings": {
      "name": "Name",
      "icon": "alphabetical-variant"
    }
  },
  {
    "id": "synonyms",
    "type": "specific",
    "settings": {
      "name": "Synonyms",
      "icon": "alphabetical"
    }
  },
  {
    "id": "country",
    "type": "specific",
    "settings": {
      "name": "Country",
      "icon": "flag"
    }
  },
  {
    "id": "duration",
    "type": "specific",
    "settings": {
      "name": "Duration",
      "icon": "timer-outline"
    }
  },
  {
    "id": "size",
    "type": "specific",
    "settings": {
      "name": "Filesize",
      "icon": "harddisk"
    }
  },
  {
    "id": "width",
    "type": "specific",
    "settings": {
      "name": "Width",
      "icon": "monitor-screenshot"
    }
  },
  {
    "id": "height",
    "type": "specific",
    "settings": {
      "name": "Height",
      "icon": "monitor-screenshot"
    }
  },
  {
    "id": "date",
    "type": "specific",
    "settings": {
      "name": "Date added",
      "icon": "calendar-plus"
    }
  },
  {
    "id": "edit",
    "type": "specific",
    "settings": {
      "name": "Editing date",
      "icon": "calendar-edit"
    }
  },
]

dbMeta.defaults({ meta: [...specificMeta], cards: [] }).write()

const Meta = {
  state: () => ({
    pageTotal: 1,
    cardsPerPage: 20,
    page: 1,
    sortBy: 'name',
    sortDirection: 'asc',
    visibility: {},
    firstChar: [],
    filters: [],
    filteredMeta: [],
    updateCardIds: [],
    selection: null,
    selectedMeta: [],
    metaList: dbMeta.get('meta').filter({type:'complex'}).value(),
    dialogEditMetaCard: false,
    dialogEditMetaCardImages: false,
    dialogFilterMetaCards: false,
    dialogDeleteMetaCard: false,
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
      const metaName = getters.meta.find({id:metaCard.metaId}).value().settings.nameSingular.toLowerCase()
      commit('addLog', {type:'info', color:'green', text:`Added ${metaName} "${metaCard.meta.name}"`})
    },
    deleteMetaCard({state, rootState, commit, dispatch, getters}) {
      const metaId = router.currentRoute.query.metaId
      const metaName = getters.meta.find({id:metaId}).value().settings.nameSingular
      state.selectedMeta.map(id => {
        let cardName = getters.metaCards.find({id}).value().meta.name
        getters.metaCards.remove({id}).write() // remove card from database
        getters.metaCards.each(mc => { // remove card from other cards
          let arr = mc.meta[metaId]
          if (arr && arr.length) {
            let index = mc.meta[metaId].indexOf(id)
            if (index !== -1) mc.meta[metaId].splice(index, 1)
          }
        }).write()
        // TODO remove from videos in array
        // TODO remove from filters
        // let tab = _.find(getters.tabs, {'id': id }) // close tab with this performer
        // if (tab) dispatch('closeTab', id)
        let imageTypes = ['main','alt','custom1','custom2','avatar','header']
        imageTypes.map(img => { // remove images of card
          let imgPath = path.join(getters.getPathToUserData, 'media', 'meta', metaId, `${id}_${img}.jpg`)
          fs.unlink(imgPath, (err) => {})
        })
        commit('addLog', {type:'info',color:'red',text:`${metaName} "${cardName}" has been removed 🗑️`})
      })
      dispatch('filterMetaCards')
      state.dialogDeleteMetaCard = false
      state.selectedMeta = []
    },
    updateMetaSettings({getters}, {id, key, value}) {
      getters.meta.find({id}).get('settings').set(key, value).write()
    },
    updateMetaState({getters}, {id, key, value}) {
      getters.meta.find({id}).get('state').set(key, value).write()
    },
    async filterMetaCards({ state, commit, dispatch, getters, rootState}) {
      const metaId = router.currentRoute.query.metaId
      let mc = getters.metaCards.filter({metaId})
      mc = mc.orderBy(i=>(i.meta.name.toLowerCase()), ['asc'])
      
      if (state.firstChar.length) { // filter by first character
        let chars = ['0123456789','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','!$@^&*\'+-_~']
        let allChars = []
        state.firstChar.forEach( char => { allChars.push(chars[char]) } )
        if (allChars.length) {
          mc = mc.filter( c => {
            let charTag = c.meta.name.charAt(0).toLowerCase()
            return allChars.includes(charTag)
          })
        }
      }

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
          if (by === 'name' && flag === true) {
            let filteredByNames = await mc.filter(c => {
              if (cond=='includes') return c.meta.name.toLowerCase().includes(val)
              else return !c.meta.name.toLowerCase().includes(val)
            }).map('id').value()

            let filteredBySynonyms = await mc.filter(c => {
              if (c.meta.synonyms===undefined || c.meta.synonyms === []) return false
              let synonyms = c.meta.synonyms.map(s=>s.toLowerCase())
              let matches = synonyms.filter(s=>{
                if (cond === 'includes') return s.includes(val)
                else return !s.includes(val)
              })
              return matches.length>0
            }).map('id').value()

            let mergedIds = _.union(filteredByNames, filteredBySynonyms)

            mc = mc.filter(c=>(mergedIds.includes(c.id)))
            continue
          }
          if (cond=='includes') mc=mc.filter(c=>c.meta[by].toLowerCase().includes(val))
          else mc=mc.filter(c=>!c.meta[by].toLowerCase().includes(val))
          continue
        }

        if (type === 'array' || type === 'select') {
          if (cond === 'includes all') mc = mc.filter(c=>{
            if (c.meta[by]===undefined) return false
            else return _.isEqual(c.meta[by].sort(), val.sort())
          })
          else if (cond === 'includes one of') mc = mc.filter(c=>{
            if (c.meta[by]===undefined || c.meta[by].length===0) return false
            else {
              let include = false
              for (let i of val) if (c.meta[by].includes(i)) {include=true;break}
              return include
            }
          })
          else if (cond === 'excludes') mc = mc.filter(c=>{
            if (c.meta[by]===undefined || c.meta[by].length===0) return false
            else {
              let include = false
              for (let i of val) if (c.meta[by].includes(i)) {include=true;break}
              return !include
            }
          })
        }
      }
      // sort meta
      let sortBy = state.sortBy || 'name'
      let sortDirection = state.sortDirection || 'asc'
      if (sortBy == 'name') mc = mc.orderBy(i=>(i.meta.name.toLowerCase()), [sortDirection])
      else if (['date','edit'].includes(sortBy)) mc = mc.orderBy(sortBy, [sortDirection])
      else mc = mc.orderBy(`meta.${sortBy}`, [sortDirection])

      state.filteredMeta = mc.value()
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
        firstChar:  state.firstChar,
      }
      if (tabId === 'default') getters.meta.find({id:metaId}).get('state').assign(data).write()
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
            metaCount = state.cardsPerPage
      state.pageTotal = Math.ceil(meta.length / metaCount)
      if (state.page > state.pageTotal) state.page = state.pageTotal
      if (state.page == 0) state.page = 1
      const end = state.page * metaCount, start = end - metaCount
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