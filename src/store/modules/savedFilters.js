const path = require("path")
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const app = require('@electron/remote').app
const pathToDbSavedFilters = path.join(app.getPath('userData'), 'userfiles/databases/dbsf.json')
const adapterSavedFilters = new FileSync(pathToDbSavedFilters)
const dbsf = low(adapterSavedFilters)
dbsf.defaults({
  savedFilters: {
    videos: [],
    playlists: [],
  }
}).write()


const SavedFilters = {
  state: () => ({
    savedFilters: _.cloneDeep(dbsf.get('savedFilters').value()),
    dialogSavedFilters: false,
  }),
  mutations: {
  },
  actions: {
    addSavedFilter({ state, commit, getters}, {type, savedFilters}) {
      getters.savedFilters.get(type).push(savedFilters).write()
      state.savedFilters[type].push(savedFilters)
    },
    deleteSavedFilter({ state, commit, getters}, {type, name}) {
      getters.savedFilters.get(type).remove({ name: name }).write()
      state.savedFilters = _.cloneDeep(getters.savedFilters.value())
    },
    updateSavedFilters({ state, commit, getters}) {
      state.savedFilters = _.cloneDeep(getters.savedFilters.value())
    },
    updateSavedFilterName({ state, dispatch, getters}, {type, oldName, newName}) {
      getters.savedFilters.get(type).find({name:oldName}).assign({name:newName}).write()
      dispatch('updateSavedFilters')
    },
    rewriteSavedFilter({ state, dispatch, getters}, {type, id, filters}) {
      getters.savedFilters.get(type).find({id}).assign({filters}).write()
      dispatch('updateSavedFilters')
    },
  },
  getters: {
    dbsf(state) { return state.lastChanged, dbsf },
    savedFiltersDatabase(state, store) { return store.dbsf },
    savedFilters(state, store) { return store.dbsf.get('savedFilters') },
  }
}

export default SavedFilters