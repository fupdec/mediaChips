const {app} = require('electron').remote
const fs = require("fs")
const path = require("path")
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
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
    deleteMarker({state, rootState, commit, dispatch, getters}, marker) {
      getters.markers.remove({id: marker.id}).write()
      // remove image of marker
      let imgPath = path.join(getters.getPathToUserData, `/media/markers/${marker.id}.jpg`)
      fs.unlink(imgPath, (err) => {
        if (err) {
          // console.log(`failed to delete image of marker "${marker.id}", "${marker.name}". ${err}`);
        } else {
          // console.log(`successfully deleted image of marker "${marker.id}", "${marker.name}"`);                                
        }
      })
    },
  },
  getters: {
    dbm(state) {
      return state.lastChanged, dbm
    },
    markersDatabase(state, store) {
      return store.dbm
    },
    markers(state, store) {
      return store.dbm.get('markers')
    },
  }
}

export default Markers