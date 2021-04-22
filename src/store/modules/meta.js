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
    icon: 'tag-outline'
  },
}

dbMeta.defaults({ meta: [{ ...defaultMeta }], simpleMeta: [] }).write()

const Meta = {
  state: () => ({
  }),
  mutations: {
  },
  actions: {
    addMeta({state, rootState, commit, dispatch, getters}, { id, name, type, settings }) {
      let meta = { ...defaultMeta, ...{ id, name, settings } }
      if (type == 'simple') getters.simpleMeta.push(meta).write()
      else getters.meta.push(meta).write()
      commit('addLog', {type:'info', color:'green', text:`Added meta "${name}"`})
    },
  },
  getters: {
    dbMeta() {
      return dbMeta
    },
    meta(state, store) {
      return store.dbMeta.get('meta')
    },
    simpleMeta(state, store) {
      return store.dbMeta.get('simpleMeta')
    },
  }
}

export default Meta