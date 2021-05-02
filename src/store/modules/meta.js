const {app} = require('electron').remote
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbMeta = path.join(app.getPath('userData'), 'userfiles/databases/meta.json')
const adapterMeta = new FileSync(pathToDbMeta)
const low = require('lowdb')
const dbMeta = low(adapterMeta)

let defaultMeta = {
  id: "defaultMeta",
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
  date: Date.now(),
  edit: Date.now(),
  meta: {
    name: "Card",
  }
}

dbMeta.defaults({ meta: [{ ...defaultMeta }], simpleMeta: [], cards: {} }).write()

const Meta = {
  state: () => ({
    pageTotal: 1,
    filteredMeta: [],
    updateCardIds: [],
  }),
  mutations: {
    updateMetaCards(state, ids) {
      if (ids === undefined) state.updateCardIds = []
      else state.updateCardIds = ids // TODO make update function
    },
  },
  actions: {
    addMeta({commit, getters, rootState}, {id, type, settings}) {
      let meta = { ...defaultMeta, ...{ id, settings } }
      if (type == 'simple') getters.simpleMeta.push(meta).write()
      else { 
        getters.meta.push(meta).write()
        getters.metaCards.set(id, []).write()
      }
      commit('addLog', {type:'info', color:'green', text:`Added meta "${settings.name}"`})
    },
    deleteMeta({commit, getters}, {id, name, type}) {
      if (type == 'simple') {
        getters.simpleMeta.remove({id}).write()
        getters.meta.filter(i => _.some(i.settings.metaInCard, {id})).each(i => {
          i.settings.metaInCard = i.settings.metaInCard.filter(x => x.id != id)}).write()
        // TODO remove from cards
      } else {
        getters.meta.remove({id}).write()
        getters.metaCards.unset(id).write() 
        getters.meta.filter(i => _.some(i.settings.metaInCard, {id})).each(i => {
          i.settings.metaInCard = i.settings.metaInCard.filter(x => x.id != id)}).write()
        // TODO remove from cards
      }
      commit('addLog', {type:'info', color:'red', text:`Deleted ${type} meta "${name}"`})
    },
    addMetaCard({commit, getters}, {cardId, metaInfo, metaId}) {
      let metaCard = { ...defaultMetaCard, ...{ id: cardId, meta: metaInfo } }
      getters.metaCards.get(metaId).push(metaCard).write()
      commit('addLog', {type:'info', color:'green', text:`Added card "${metaInfo.name}"`})
    },
    async filterMetaCards({state, getters}, {metaId, stayOnCurrentPage}) {
      let meta = getters.metaCards.get(metaId)
      meta = meta.orderBy(i=>(i.meta.name.toLowerCase()), ['asc'])
      state.filteredMeta = meta.value()
    },
    updateMetaSettings({getters}, {id, type, key, value}) {
      if (type == 'simple') getters.simpleMeta.find({id}).get('settings').set(key, value).write()
      else getters.meta.find({id}).get('settings').set(key, value).write()
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
    simpleMeta(state, store) {
      return store.dbMeta.get('simpleMeta')
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
  }
}

export default Meta