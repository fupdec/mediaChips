const {app} = require('electron').remote
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbMeta = path.join(app.getPath('userData'), 'userfiles/databases/meta.json')
const adapterMeta = new FileSync(pathToDbMeta)
const low = require('lowdb')
const dbMeta = low(adapterMeta)

let defaultMeta = {
  id: "defaultMeta",
  name: "Tags",
  date: Date.now(),
  edit: Date.now(),
  settings: {
    icon: 'tag-outline',
    cardSize: 1,
  },
}

let defaultMetaCard = {
  id: "defaultMetaCard",
  name: "Card",
  date: Date.now(),
  edit: Date.now(),
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
      else state.updateCardIds = ids
    },
  },
  actions: {
    addMeta({commit, getters}, {id, name, type, settings}) {
      let meta = { ...defaultMeta, ...{ id, name, settings } }
      if (type == 'simple') getters.simpleMeta.push(meta).write()
      else { getters.meta.push(meta).write(); getters.metaCards.set(id, []).write() }
      commit('addLog', {type:'info', color:'green', text:`Added meta "${name}"`})
    },
    deleteMeta({commit, getters}, {id, name, type}) {
      if (type == 'simple') getters.simpleMeta.remove({id}).write()
      else { getters.meta.remove({id}).write(); getters.metaCards.unset(id).write() }
      commit('addLog', {type:'info', color:'red', text:`Deleted meta "${name}"`})
    },
    addMetaCard({commit, getters}, {cardId, name, metaId}) {
      let metaCard = { ...defaultMetaCard, ...{ id: cardId, name } }
      getters.metaCards.get(metaId).push(metaCard).write()
      commit('addLog', {type:'info', color:'green', text:`Added card "${name}"`})
    },
    async filterMetaCards({state, getters}, {metaId, stayOnCurrentPage}) {
      let meta = getters.metaCards.get(metaId)
      meta = meta.orderBy(i=>(i.name.toLowerCase()), ['asc'])
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