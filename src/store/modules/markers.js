const {app} = require('electron').remote
const path = require("path")
const low = require('lowdb')
const FileSync = require('@/components/elements/LowDbAdapter')
const pathToDbBookmarks = path.join(app.getPath('userData'), 'userfiles/databases/dbm.json')
const adapterBookmarks = new FileSync(pathToDbBookmarks)
const dbm = low(adapterBookmarks)

dbm.defaults({ markers: [] }).write()

const Markers = {
  state: () => ({
    lastChanged: Date.now(),
  }),
  mutations: {
  },
  actions: {
  },
  getters: {
    dbm(state) {
      return state.lastChanged, dbm
    },
    markersDataBase(state, store) {
      return store.dbm
    },
    markers(state, store) {
      return store.dbm.get('markers')
    },
  }
}

export default Markers