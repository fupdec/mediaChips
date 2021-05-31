const {app} = require('electron').remote
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbSettings = path.join(app.getPath('userData'), 'userfiles/dbs.json')
const adapterSettings = new FileSync(pathToDbSettings)
const low = require('lowdb')
const dbs = low(adapterSettings)

import router from '@/router'
import Vuetify from '@/plugins/vuetify'

dbs.defaults({
  passwordProtection: false,
  phrase: '',
  passwordHint: '',
  videoPreviewStatic: 'thumb',
  videoPreviewHover: 'timeline',
  delayVideoPreview: 0,
  appColorLightPrimary: '#ef0051',
  appColorLightSecondary: '#d80155',
  appColorLightAccent: '#14db00',
  appColorLightHeader: '#ff0f60',
  appColorDarkPrimary: '#2175ab',
  appColorDarkSecondary: '#3797cd',
  appColorDarkAccent: '#84329e',
  appColorDarkHeader: '#2b6c90',
  darkMode: false,
  headerGradient: true,
  headerGradientLight: 'linear-gradient(to right, #00ffff, #ff9800, #7a00ff)',
  headerGradientDark: 'linear-gradient(to right, #0033a5, #c30059, #C5A401)',
  textFont: 'Roboto',
  headerFont: 'Roboto',
  navigationSide: "1",
  numberOfPagesLimit: 7,
  videoCardSize: 3,
  performerCardSize: 3,
  performerFilters: [],
  performerSortBy: 'name',
  performerSortDirection: 'asc',
  performerPage: 1,
  performerFirstChar: [],
  performerInfoEthnicity: ["Asian","Black","Caucasian","Hispanic","Latin","White"],
  performerInfoHair: ["Black","Blonde","Brown","Brunette","Grey","Red","White"],
  performerInfoEyes: ["Blue","Brown","Green","Grey","Hazel"],
  performerInfoCups: ["AA","A","B","C","D","DD","DDD","E","EE","EEE","F","FF","G","GG","H","HH","I","J","JJ","K","L","M","N"],
  performerInfoCategory: ["Pornstar","Erotic model","Webcam model","Amateur"],
  performerInfoBoobs: ["Real","Fake"],
  performerChipsColored: true,
  performerEditBtnHidden: false,
  performerMeterHidden: false,
  performerNameHidden: false,
  performerRatingHidden: false,
  performerNationalityHidden: false,
  performerFavoriteHidden: false,
  performerProfileProgressHidden: false,
  performerAliasesHidden: false,
  performerCareerStatusHidden: false,
  performerTagsHidden: false,
  performerVideoTagsHidden: false,
  performerWebsitesHidden: false,
  performerProfile: false,
  performerProfileTags: true,
  performerProfileWebsites: true,
  performerBottomProfileHidden: false,
  selectedDisk: '',
  videoFilters: [],
  videoSortBy: 'name',
  videoSortDirection: 'asc',
  videoPage: 1,
  videoChipsColored: true,
  videoEditBtnHidden: false,
  videoFileNameHidden: false,
  videoFileInfoHidden: false,
  videoRatingHidden: false,
  videoFavoriteHidden: false,
  videoQualityLabelHidden: false,
  videoDurationHidden: false,
  videoPerformersHidden: false,
  videoTagsHidden: false,
  ratingAndFavoriteInCard: false,
  videoEditPerformersSortBy: 'name',
  videoEditTagsSortBy: 'name',
  videoEditWebsitesSortBy: 'name',
  videoMetaInCard: [],
  videoVisibility: {},
  tagAltNamesHidden: false,
  tagPerformersHidden: false,
  tagEditBtnHidden: false,
  tagFilters: [],
  tagSortBy: 'name',
  tagSortDirection: 'asc',
  tagPage: 1,
  tagFirstChar: [],
  tagColor: [],
  tagInfoCategory: [],
  tagView: 'default',
  websiteVideoTagsHidden: false,
  websitePerformersHidden: false,
  websiteEditBtnHidden: false,
  websiteFilters: [],
  websiteSortBy: 'name',
  websiteSortDirection: 'asc',
  websitePage: 1,
  websiteFirstChar: [],
  websiteColor: [],
  websiteView: 'default',
  playlistFilters: [],
  playlistSortBy: 'name',
  playlistSortDirection: 'asc',
  playlistPage: 1,
  backups: [],
  tabs: [],
  meterHeight: 5,
  meterMultiplier: 1,
  pathToSystemPlayer: '',
  videosFiltersPresetDefault: false,
  performersFiltersPresetDefault: false,
  tagsFiltersPresetDefault: false,
  websitesFiltersPresetDefault: false,
  videosPerPage: 20,
  performersPerPage: 20,
  tagsPerPage: 20,
  websitesPerPage: 20,
  playlistsPerPage: 20,
  gapSize: 's',
  isPlayVideoInSystemPlayer: false,
  customParametersPerformer: [],
  updateIntervalDataFromVideos: 30,
  autoUpdateDataFromVideos: true,
  updateDataFromVideosOnStart: false,
  typingFiltersDefault: false,
  watchFolders: false,
  folders: [],
  zoom: 1,
  checkForUpdatesAtStartup: false,
  registration: '',
  colorScroll: false,
  tabBorders: true,
}).write()

const Settings = {
  state: () => ({
    passwordProtection: dbs.get('passwordProtection').value(),
    phrase: dbs.get('phrase').value(),
    passwordConfirmed: false,
    passwordHint: dbs.get('passwordHint').value(),
    videoPreviewStatic: dbs.get('videoPreviewStatic').value(),
    videoPreviewHover: dbs.get('videoPreviewHover').value(),
    delayVideoPreview: dbs.get('delayVideoPreview').value(),
    darkMode: dbs.get('darkMode').value(),
    headerGradient: dbs.get('headerGradient').value(),
    headerGradientLight: dbs.get('headerGradientLight').value(),
    headerGradientDark: dbs.get('headerGradientDark').value(),
    navigationSide: dbs.get('navigationSide').value(),
    appColorLightPrimary: dbs.get('appColorLightPrimary').value(),
    appColorLightSecondary: dbs.get('appColorLightSecondary').value(),
    appColorLightAccent: dbs.get('appColorLightAccent').value(),
    appColorLightHeader: dbs.get('appColorLightHeader').value(),
    appColorDarkPrimary: dbs.get('appColorDarkPrimary').value(),
    appColorDarkSecondary: dbs.get('appColorDarkSecondary').value(),
    appColorDarkAccent: dbs.get('appColorDarkAccent').value(),
    appColorDarkHeader: dbs.get('appColorDarkHeader').value(),
    textFont: dbs.get('textFont').value(),
    headerFont: dbs.get('headerFont').value(),
    lastChanged: Date.now(),
    numberOfPagesLimit: dbs.get('numberOfPagesLimit').value(),
    dialogScanVideos: false,
    scanProcRun: false,
    ratingAndFavoriteInCard: dbs.get('ratingAndFavoriteInCard').value(),
    selectedDisk: dbs.get('selectedDisk').value() || '',
    videoFilters: [],
    videoSortBy: 'name',
    videoSortDirection: 'asc',
    videoPage: 1,
    videosPerPage: dbs.get('videosPerPage').value() || 20,
    videoCardSize: dbs.get('videoCardSize').value(),
    videoChipsColored: dbs.get('videoChipsColored').value() || true,
    videoEditBtnHidden: dbs.get('videoEditBtnHidden').value() || false,
    videoFileNameHidden: dbs.get('videoFileNameHidden').value() || false,
    videoFileInfoHidden: dbs.get('videoFileInfoHidden').value() || false,
    videoRatingHidden: dbs.get('videoRatingHidden').value() || false,
    videoFavoriteHidden: dbs.get('videoFavoriteHidden').value() || false,
    videoQualityLabelHidden: dbs.get('videoQualityLabelHidden').value() || false,
    videoDurationHidden: dbs.get('videoDurationHidden').value() || false,
    videoPerformersHidden: dbs.get('videoPerformersHidden').value() || false,
    videoTagsHidden: dbs.get('videoTagsHidden').value() || false,
    videoWebsiteHidden: dbs.get('videoWebsiteHidden').value() || false,
    videoEditPerformersSortBy: dbs.get('videoEditPerformersSortBy').value(),
    videoEditTagsSortBy: dbs.get('videoEditTagsSortBy').value(),
    videoEditWebsitesSortBy: dbs.get('videoEditWebsitesSortBy').value(),
    videoMetaInCard: dbs.get('videoMetaInCard').value(),
    videoVisibility: dbs.get('videoVisibility').value(),
    performerFilters: [],
    performerSortBy: 'name',
    performerSortDirection: 'asc',
    performerPage: 1,
    performerFirstChar: [],
    performersPerPage: dbs.get('performersPerPage').value() || 20,
    performerChipsColored: dbs.get('performerChipsColored').value() || true,
    performerEditBtnHidden: dbs.get('performerEditBtnHidden').value() || false,
    performerMeterHidden: dbs.get('performerMeterHidden').value() || false,
    performerNameHidden: dbs.get('performerNameHidden').value() || false,
    performerRatingHidden: dbs.get('performerRatingHidden').value() || false,
    performerNationalityHidden: dbs.get('performerNationalityHidden').value() || false,
    performerFavoriteHidden: dbs.get('performerFavoriteHidden').value() || false,
    performerProfileProgressHidden: dbs.get('performerProfileProgressHidden').value() || false,
    performerAliasesHidden: dbs.get('performerAliasesHidden').value() || false,
    performerCareerStatusHidden: dbs.get('performerCareerStatusHidden').value() || false,
    performerTagsHidden: dbs.get('performerTagsHidden').value() || false,
    performerVideoTagsHidden: dbs.get('performerVideoTagsHidden').value() || false,
    performerWebsitesHidden: dbs.get('performerWebsitesHidden').value() || false,
    performerCardSize: dbs.get('performerCardSize').value(),
    performerInfoEthnicity: dbs.get('performerInfoEthnicity').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoHair: dbs.get('performerInfoHair').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoEyes: dbs.get('performerInfoEyes').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoCups: dbs.get('performerInfoCups').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoCategory: dbs.get('performerInfoCategory').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoBoobs: dbs.get('performerInfoBoobs').value(),
    performerProfile: dbs.get('performerProfile').value(),
    performerProfileTags: dbs.get('performerProfileTags').value(),
    performerProfileWebsites: dbs.get('performerProfileWebsites').value(),
    performerBottomProfileHidden: dbs.get('performerBottomProfileHidden').value(),
    tagsPerPage: dbs.get('tagsPerPage').value() || 20,
    tagAltNamesHidden: dbs.get('tagAltNamesHidden').value() || false,
    tagPerformersHidden: dbs.get('tagPerformersHidden').value() || false,
    tagEditBtnHidden: dbs.get('tagEditBtnHidden').value() || false,
    tagFilters: [],
    tagSortBy: 'name',
    tagSortDirection: 'asc',
    tagPage: 1,
    tagFirstChar: [],
    tagColor: [],
    websitesPerPage: dbs.get('websitesPerPage').value() || 20,
    websiteVideoTagsHidden: dbs.get('websiteVideoTagsHidden').value() || false,
    websitePerformersHidden: dbs.get('websitePerformersHidden').value() || false,
    websiteEditBtnHidden: dbs.get('websiteEditBtnHidden').value() || false,
    websiteFilters: [],
    websiteSortBy: 'name',
    websiteSortDirection: 'asc',
    websitePage: 1,
    websiteFirstChar: [],
    websiteColor: [],
    playlistsPerPage: dbs.get('playlistsPerPage').value() || 20,
    playlistFilters: [],
    playlistSortBy: 'name',
    playlistSortDirection: 'asc',
    playlistPage: 1,
    backups: dbs.get('backups').value(),
    tab: null,
    tabs: _.cloneDeep(dbs.get('tabs').value()),
    meterHeight: dbs.get('meterHeight').value(),
    meterMultiplier: dbs.get('meterMultiplier').value(),
    pathToSystemPlayer: dbs.get('pathToSystemPlayer').value(),
    videosFiltersPresetDefault: dbs.get('videosFiltersPresetDefault').value(),
    performersFiltersPresetDefault: dbs.get('performersFiltersPresetDefault').value(),
    tagsFiltersPresetDefault: dbs.get('tagsFiltersPresetDefault').value(),
    tagInfoCategory: dbs.get('tagInfoCategory').value().sort((a,b)=>a.localeCompare(b)),
    tagView: dbs.get('tagView').value(),
    websitesFiltersPresetDefault: dbs.get('websitesFiltersPresetDefault').value(),
    websiteView: dbs.get('websiteView').value(),
    dialogHeaderGradient: false,
    gapSize: dbs.get('gapSize').value(),
    isPlayVideoInSystemPlayer: dbs.get('isPlayVideoInSystemPlayer').value(),
    dialogManagePerformerParameters: false,
    customParametersPerformer: _.cloneDeep(dbs.get('customParametersPerformer').value()),
    updateIntervalDataFromVideos: dbs.get('updateIntervalDataFromVideos').value(),
    autoUpdateDataFromVideos: dbs.get('autoUpdateDataFromVideos').value(),
    updateDataFromVideosOnStart: dbs.get('updateDataFromVideosOnStart').value(),
    typingFiltersDefault: dbs.get('typingFiltersDefault').value(),
    watchFolders: dbs.get('watchFolders').value(),
    folders: dbs.get('folders').value(),
    zoom: dbs.get('zoom').value(),
    checkForUpdatesAtStartup: dbs.get('checkForUpdatesAtStartup').value(),
    registration: dbs.get('registration').value(),
    colorScroll: dbs.get('colorScroll').value(),
    tabBorders: dbs.get('tabBorders').value(),
  }),
  mutations: {
    updateBackups(state, value) {
      state.backups = value
    },
    closeTab(state, tabId) {
      state.tabs = _.filter(state.tabs, tab => tab.id !== tabId)
    },
    getTabsFromDb(state, tabs) {
      state.tabs = _.cloneDeep(dbs.get('tabs').value())
    },
    updateTabs(state, tabs) { // TODO create mutation for update any value in settings
      state.tabs = _.cloneDeep(tabs)
    },
  },
  actions: {
    saveHeaderGradient({ state, commit, getters}, {gradient, themeDark}) {
      console.log(themeDark)
      if (themeDark) {
        getters.settings.set('headerGradientDark', gradient).write()
        state.headerGradientDark = gradient
      } else {
        getters.settings.set('headerGradientLight', gradient).write()
        state.headerGradientLight = gradient
      }
    },
    updateBackups ({ state, commit, getters}, value) {
      commit('updateBackups', getters.backups)
    },
    addNewTab({state, rootState, commit, dispatch, getters}, tab) {
      getters.tabsDb.push(tab).write()
      state.tabs.push(tab)
    },
    closeTab({state, rootState, commit, dispatch, getters}, tabId) {
      let currentTab = getters.tabsDb.find({id: tabId}).value()
      if (currentTab) { // if tab is open
        if (currentTab.link === router.currentRoute.fullPath) {
          const numberTabs = getters.tabsDb.value().length
          if (numberTabs > 1) {
            const tabIndex = getters.tabsDb.findIndex({id: tabId}).value()
            if (numberTabs === tabIndex + 1) {
              router.push(getters.tabsDb.value()[tabIndex-1].link)
            } else {
              router.push(getters.tabsDb.value()[tabIndex+1].link)
            } 
          } else router.push('/home')
        }
      }
      getters.tabsDb.remove({id: tabId}).write()
      commit('closeTab', tabId)
    },
    updateTabs({state, rootState, commit, dispatch, getters}, tabs) {
      getters.settings.set('tabs', _.cloneDeep(tabs)).write()
      commit('updateTabs', tabs)
    },
    updateSettingsState({state, rootState, commit, dispatch, getters}, {key, value}) {
      getters.settings.set(key, value).write()
      state[key] = value
    },
    updateVuetifyColor({state, rootState, commit, dispatch, getters}, {key, color, theme, type}) {
      getters.settings.set(key, color).write()
      state[key] = color
      Vuetify.framework.theme.themes[theme][type] = color
    },
  },
  getters: {
    dbs(state) {
      return state.lastChanged, dbs
    },
    settings(state, store) {
      return store.dbs
    },
    backups(state, store) {
      return store.dbs.get('backups').value()
    },
    tabsDb(state, store) {
      return store.dbs.get('tabs')
    },
    tabs(state, store) {
      return state.tabs
    },
  }
}

export default Settings