const { ipcRenderer } = require('electron')
const fs = require("fs")
const path = require("path")
const rimraf = require("rimraf")
const FileSync = require('lowdb/adapters/FileSync')
const configPath = path.join(__static, 'config.json')
const config = JSON.parse(fs.readFileSync(configPath).toString())
const pathToDbMeta = path.join(config.path, 'userfiles/databases/meta.json')
const adapterMeta = new FileSync(pathToDbMeta)
const low = require('lowdb')
const dbMeta = low(adapterMeta)

import router from '@/router'
import SpecificMeta from '@/components/elements/SpecificMeta'
import Countries from '@/components/elements/Countries'
import chroma from 'chroma-js'

let defaultMeta = {
  id: "defaultMeta",
  type: 'complex',
  date: Date.now(),
  edit: Date.now(),
  settings: {
    name: "Tags",
    icon: 'tag-outline',
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

dbMeta.defaults({ meta: [...SpecificMeta], cards: [] }).write()

const Meta = {
  state: () => ({
    pageTotal: 1,
    cardsPerPage: 20,
    page: 1,
    sortBy: 'name',
    sortDirection: 'asc',
    visibility: {},
    view: 0,
    cardSize: 3,
    colors: [],
    firstChar: [],
    filters: [],
    filteredMeta: [],
    updateCardIds: [],
    selection: null,
    selectedMeta: [],
    complexMetaList: dbMeta.get('meta').filter({type:'complex'}).value(),
    simpleMetaList: dbMeta.get('meta').filter({type:'simple'}).value(),
    dialogEditMetaCard: false,
    dialogEditMetaCardImages: false,
    dialogFilterMetaCards: false,
    dialogDeleteMetaCard: false,
    dialogScrapeInfoMetaCard: false,
  }),
  mutations: {
    updateMetaCards(state, ids) {
      if (ids === undefined) state.updateCardIds = []
      else state.updateCardIds = ids // TODO make update function
    },
    updateComplexMetaListFromDb(state) {
      state.complexMetaList = _.cloneDeep(dbMeta.get('meta').filter({type:'complex'}).value())
    },
    updateSimpleMetaListFromDb(state) {
      state.simpleMetaList = _.cloneDeep(dbMeta.get('meta').filter({type:'simple'}).value())
    },
  },
  actions: {
    addComplexMeta({commit, getters, rootState}, metaObject) {
      let meta = { ...defaultMeta, ...{date: Date.now(),edit: Date.now()}, ...metaObject }
      getters.meta.push(meta).write()
      getters.metaCards.set(meta.id, []).write()
      getters.savedFilters.set(meta.id, []).write()
      commit('updateComplexMetaListFromDb')
      commit('addLog', {type:'info', color:'green', text:`Added complex meta "${meta.settings.name}"`})
      ipcRenderer.send('updatePlayerDb', 'meta') // update meta in player window
    },
    addSimpleMeta({commit, getters, rootState}, metaObject) {
      let meta = { ...defaultMeta, ...{date: Date.now(),edit: Date.now()}, ...metaObject }
      getters.meta.push(meta).write()
      commit('updateSimpleMetaListFromDb')
      commit('addLog', {type:'info', color:'green', text:`Added simple meta "${metaObject.settings.name}"`})
    },
    deleteComplexMeta({commit, dispatch, getters}, {id, name}) {
      getters.metaCards.remove({metaId:id}).write() // delete all cards from database
      getters.markers.each(marker=>{ // rename/delete markers
        if (marker.type===id) {
          let mc = getters.metaCards.find({id:marker.name}).value()
          if (mc) {marker.type = 'bookmark'; marker.name = mc.meta.name}
          else dispatch('deleteMarker', marker)
        }
      }).write()
      rimraf(path.join(getters.getPathToUserData, 'media', 'meta', id), () => { /*console.log("done")*/ }) // remove folder with images
      dispatch('removeMetaFromOtherMeta', id) // META
      dispatch('removeMetaFromVideos', id) // VIDEOS
      dispatch('removeMetaFromSavedFilters', id) // SAVED FILTERS
      dispatch('removeMetaFromTabs', id) // TABS
      commit('addLog', {type:'info', color:'red', text:`Deleted complex meta "${name}"`})
      ipcRenderer.send('updatePlayerDb', 'meta') // update meta in player window
      ipcRenderer.send('updatePlayerDb', 'metaCards') // update meta in player window
      ipcRenderer.send('updatePlayerDb', 'markers') // update markers in player window
    },
    deleteSimpleMeta({commit, dispatch, getters}, {id, name}) {
      dispatch('removeMetaFromOtherMeta', id) // META
      dispatch('removeMetaFromVideos', id) // VIDEOS
      dispatch('removeMetaFromSavedFilters', id) // SAVED FILTERS
      dispatch('removeMetaFromTabs', id) // TABS
      commit('addLog', {type:'info', color:'red', text:`Deleted simple meta "${name}"`})
    },
    addMetaCard({commit, getters}, newMetaCard) {
      let metaCard = { ...defaultMetaCard, ...{date: Date.now(),edit: Date.now()},...newMetaCard }
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
        dispatch('removeMetaItemFromFiltersAndCards', {metaId,id})
        let imageTypes = ['main','alt','custom1','custom2','avatar','header']
        imageTypes.map(img => { // remove images of card
          let imgPath = path.join(getters.getPathToUserData, 'media', 'meta', metaId, `${id}_${img}.jpg`)
          fs.unlink(imgPath, (err) => {})
        })
        getters.markers.filter({type:metaId}).each(marker=>{ // rename/delete markers
          if (marker.name === id) {marker.type = 'bookmark'; marker.name = cardName}
        }).write()
        commit('addLog', {type:'info',color:'red',text:`${metaName} "${cardName}" has been removed 🗑️`})
      })
      dispatch('filterMetaCards')
      state.dialogDeleteMetaCard = false
      state.selectedMeta = []
      ipcRenderer.send('updatePlayerDb', 'metaCards') // update meta in player window
      ipcRenderer.send('updatePlayerDb', 'markers') // update markers in player window
    },
    updateMetaSettings({getters}, {id, key, value}) {
      getters.meta.find({id}).get('settings').set(key, value).write()
    },
    updateMetaState({getters}, {id, key, value}) {
      getters.meta.find({id}).get('state').set(key, value).write()
    },
    removeMetaFromOtherMeta({getters, commit}, id) {
      getters.meta.remove({id}).write() // delete from database
      getters.meta.filter({type:'complex'}).each(m=>{ _.remove(m.state.filters, f=>f.by===id) }).write() // delete from all meta filters
      getters.meta.filter(i=>_.some(i.settings.metaInCard,{id})).each(i=>{ i.settings.metaInCard=i.settings.metaInCard.filter(x=>x.id!=id)}).write() // assigned to other meta
      getters.metaCards.each(mc=>{delete mc.meta[id]}).write() // delete from meta cards
    },
    removeMetaFromVideos({getters, commit}, id) {
      getters.videos.each(video=>{delete video[id]}).write() // remove from all videos
      getters.settings.get('metaAssignedToVideos').remove({id}).write() // remove from assigned videos
      commit('updateSettingsState', 'metaAssignedToVideos')
      getters.settings.get('videoFilters').remove({by:id}).write() // remove from video filters
      commit('updateSettingsState', 'videoFilters')
      getters.settings.get('videoVisibility').unset(id).write() // remove from videos visiblity 
    },
    removeMetaFromSavedFilters({getters, commit, dispatch}, id) {
      getters.savedFilters.unset(id).write() // delete saved filters from database
      getters.savedFilters.each(sfType=>{ for (let sf of sfType) _.remove(sf.filters, f=>f.by===id) }).write() // delete from saved filters
      dispatch('updateSavedFilters')
    },
    removeMetaFromTabs({getters, commit}, id) {
      getters.settings.get('tabs').remove(i=>i.link.includes(id)).write() // close tabs
      getters.settings.get('tabs').each(tab=>{
        tab.filters = _.filter(tab.filters, i=>i.by!==id)
      }).write() // remove from tab's filters
      commit('updateSettingsState', 'tabs') // update tabs
    },
    removeMetaItemFromFiltersAndCards({commit, dispatch, getters}, {metaId, id}) {
      getters.metaCards.each(mc => { // remove from other meta cards
        let arr = mc.meta[metaId]
        if (arr && arr.length) {
          let index = mc.meta[metaId].indexOf(id)
          if (index > -1) mc.meta[metaId].splice(index, 1)
        }
      }).write()
      getters.videos.each(video => { // remove from videos meta array
        let arr = video[metaId]
        if (arr && arr.length) {
          let index = video[metaId].indexOf(id)
          if (index > -1) video[metaId].splice(index, 1)
        }
      }).write()
      getters.meta.filter({type:'complex'}).each(m=>{ // remove from filters of all meta
        if (!m.state.filters) return true
        for (let f of m.state.filters) {
          if (f.by === metaId) {
            let index = f.val.indexOf(id)
            if (index > -1) f.val.splice(index, 1)
          }
        }
      }).write()
      getters.settings.get('videoFilters').each(f=>{ // remove from filters of videos
        if (f.by === metaId) {
          let index = f.val.indexOf(id)
          if (index > -1) f.val.splice(index, 1)
        }
      }).write()
      getters.savedFilters.each(sfType=>{ // remove from filters of saved filters
        for (let sf of sfType) {
          for (let f of sf.filters) {
            if (f.by === metaId) {
              let index = f.val.indexOf(id)
              if (index > -1) f.val.splice(index, 1)
            }
          }
        }
      }).write()
      dispatch('updateSavedFilters')
      getters.settings.get('tabs').each(tab=>{ // remove from filters of tabs
        if (!tab.filters) return true
        for (let f of tab.filters) {
          if (f.by === metaId) {
            let index = f.val.indexOf(id)
            if (index > -1) f.val.splice(index, 1)
          }
        }
      }).write()
      commit('updateSettingsState', 'tabs') // update tabs
    },
    async filterMetaCards({ state, commit, dispatch, getters, rootState}) {
      const metaId = router.currentRoute.query.metaId
      let mc = getters.metaCards.filter({metaId})
      mc = mc.orderBy(i=>(i.meta.name.toLowerCase()), ['asc'])
      
      if (state.firstChar.length) { // filter by first character
        let chars = ['0123456789!?%$@^&*\'"+-_~','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
        let selectedChars = ''
        state.firstChar.forEach( char => { selectedChars += chars[char] } )
        mc = mc.filter( c => {
          let firstChar = c.meta.name.charAt(0).toLowerCase()
          return selectedChars.includes(firstChar)
        })
      }

      function getColor(color, swatches) {
        color = chroma(color||'#777777').hsl()[0]
        return swatches.reduce((prev, curr) => Math.abs(curr - color) < Math.abs(prev - color) ? curr : prev);
      }
      
      if (state.colors.length) { // filter by color
        let swatches = rootState.swatches.map(i=>chroma(i).hsl()[0])
        let selected = state.colors.map(i=>chroma(i).hsl()[0])
        mc = mc.filter( c => selected.includes( getColor(c.meta.color, swatches) ) )
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

        if (type=='string') val = val.toLowerCase().trim()
        if ((val===null||val.length===0)&&(cond!='empty'&&cond!='not empty')) continue
        if (cond=='empty') {
          if (type === 'number') mc=mc.filter(c=>c.meta[by]===undefined||c.meta[by]===0)
          else mc=mc.filter(c=>c.meta[by]===undefined||c.meta[by]===null||c.meta[by]==0||c.meta[by].length==0)
          continue
        } 
        if (cond=='not empty') {
          if (type === 'number') mc=mc.filter(c=>c.meta[by]!==undefined&&c.meta[by]!==0)
          else mc=mc.filter(c=>c.meta[by]!==undefined&&c.meta[by]!==null&&c.meta[by].length>0)
          continue
        }

        if (type === 'number' || type === 'date') {
          if (by === 'date') val = new Date(val).getTime()
          if (by=='videos'||by=='views') mc = mc.filter(c => compare(cond, val, c[by]))
          else mc = mc.filter(c => compare(cond, val, c.meta[by]))
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
          if (cond=='includes') mc=mc.filter(c=>c.meta[by]?c.meta[by].toLowerCase().includes(val):false)
          else mc=mc.filter(c=>c.meta[by]?!c.meta[by].toLowerCase().includes(val):true)
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
      if (sortBy == 'name') mc = mc.orderBy(i=>i.meta.name.toLowerCase(), [sortDirection])
      else if (['date','edit','videos','views'].includes(sortBy)) mc = mc.orderBy(i=>i[sortBy]||false, [sortDirection])
      else {
        let meta = getters.meta.find({id:sortBy}).value()
        let defaultValue = false
        if (meta) {
          if (meta.dataType == 'date') defaultValue = '' 
          else if (meta.dataType=='number' || meta.dataType=='rating') defaultValue = 0 
        }
        mc = mc.orderBy(i=>i.meta[sortBy]||defaultValue, [sortDirection])
      } 

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
        colors:  state.colors,
        cardsPerPage:  state.cardsPerPage,
      }
      if (tabId === 'default') getters.meta.find({id:metaId}).get('state').assign(data).write()
      else { 
        const dataForTab = {
          name: getters.metaFiltersForTabName,
          icon: getters.meta.find({id:metaId}).value().settings.icon,
        }
        getters.tabsDb.find({id: tabId}).assign({...data,...dataForTab} ).write(); commit('getTabsFromDb') 
      }
    },
  },
  getters: {
    dbMeta() { return dbMeta },
    meta(state, store) { return store.dbMeta.get('meta') },
    metaCards(state, store) { return store.dbMeta.get('cards') },
    complexMeta(state, store) { return store.dbMeta.get('meta').filter({type:'complex'}) },
    simpleMeta(state, store) { return store.dbMeta.get('meta').filter({type:'simple'}) },
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
    metaFiltersForTabName: (state, store, rootState, getters) => {
      const metaId = router.currentRoute.query.metaId
      let filters = []
      const equals = ['equal', 'includes all', 'includes one of', 'yes']
      const notEquals = ['not equal', 'excludes', 'no']
      let meta = getters.meta.find({id:metaId}).value()
      
      for (let filter of state.filters) {
        let by = filter.by
        let cond = filter.cond
        let val = filter.val
        let type = filter.type
        let flag = filter.flag
        
        let metaBy = getters.meta.find({id:by}).value()
        if (metaBy) by = metaBy.settings.name

        if (val === null || val.length === 0) continue
        
        if (equals.includes(cond)) cond = '='
        if (notEquals.includes(cond)) cond = '!='
        
        if (type === 'array' || type === 'select') {
          if (by === 'Country') val = val.map(name=>_.find(Countries, {name}).name)
          else if (type === 'select') val = val.map(id=>getters.metaCards.find({id}).value().meta.name)
          else if (type === 'array') val = val.map(id=>_.find(metaBy.settings.items, {id}).name)
          let arr = `"${by}" ${cond}`
          arr = `${arr} "${val.join(', ')}"` 
          filters.push(arr)
        } else filters.push(`"${by}" ${cond} "${val}"`)
      }
      return meta.settings.name + (filters.length ? ' with ': ' ') + filters.join('; ')
    },
  }
}

export default Meta