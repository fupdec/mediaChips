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
  },
  filtersPresets: {
    videos: [],
    performers: [],
    tags: [],
    websites: [],
  },
}).write()


const Bookmarks = {
  state: () => ({
    bookmarkText: '',
    filtersPresets: _.cloneDeep(dbb.get('filtersPresets').value()),
    dialogFiltersPresets: false,
    videosDefaultPresetLoaded: false,
    performersDefaultPresetLoaded: false,
    tagsDefaultPresetLoaded: false,
    websitesDefaultPresetLoaded: false,
  }),
  mutations: {
    addFiltersPreset(state, {type, preset}) {
      state.filtersPresets[type].push(preset)
    },
  },
  actions: {
    addFiltersPreset({ state, commit, getters}, {type, preset}) {
      getters.filtersPresets.get(type).push(preset).write()
      commit('addFiltersPreset', {type, preset})
    },
    setPresetAsDefault({ state, commit, getters}, {type, presetName}) {
      getters.filtersPresets.get(type).each(v=>{v.default = false}).write()
      getters.filtersPresets.get(type).find({name:presetName}).assign({default:true}).write()
      getters.settings.assign({[`${type}FiltersPresetDefault`]: true}).write()
      state.filtersPresets = _.cloneDeep(getters.filtersPresets.value())
    },
    removePresetsByDefault({ state, commit, getters}, type) {
      getters.filtersPresets.get(type).each(preset=>{preset.default = false}).write()
      getters.settings.assign({[`${type}FiltersPresetDefault`]: false}).write()
      state.filtersPresets = _.cloneDeep(getters.filtersPresets.value())
    },
    deleteFiltersPreset({ state, commit, getters}, {type, presetName}) {
      getters.filtersPresets.get(type).remove({ name: presetName }).write()
      state.filtersPresets = _.cloneDeep(getters.filtersPresets.value())
    },
    updateFiltersPresetName({ state, commit, getters}, {type, oldName, newName}) {
      getters.filtersPresets.get(type).find({name:oldName}).assign({name:newName}).write()
      state.filtersPresets = _.cloneDeep(getters.filtersPresets.value())
    },
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
    filtersPresets(state, store) {
      return store.dbb.get('filtersPresets')
    },
  }
}

export default Bookmarks