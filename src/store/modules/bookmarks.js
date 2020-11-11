const {app} = require('electron').remote
const path = require("path")
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbBookmarks = path.join(app.getPath('userData'), 'userfiles/databases/dbb.json')
const adapterBookmarks = new FileSync(pathToDbBookmarks)
const dbb = low(adapterBookmarks)
dbb.defaults({
  bookmarks: {
    videos: [],
    performers: [],
    tags: [],
    websites: [],
    markers: [],
  }
}).write()


const Bookmarks = {
  state: () => ({
    bookmarkText: '',
  }),
  mutations: {
  },
  actions: {
  },
  getters: {
    dbb(state) {
      return state.lastChanged, dbb
    },
    bookmarksDataBase(state, store) {
      return store.dbb
    },
    bookmarks(state, store) {
      return store.dbb.get('bookmarks')
    },
  }
}

export default Bookmarks