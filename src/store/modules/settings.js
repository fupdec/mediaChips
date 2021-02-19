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
  videoPreviewEnabled: true,
  videoPreviewGridEnabled: false,
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
  performerFilters: [{param: null,cond: null,val: null,type: null,flag: null,lock: false,}],
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
  selectedDisk: '',
  videoFilters: [{param: null,cond: null,val: null,type: null,flag: null,lock: false,}],
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
  tagAltNamesHidden: false,
  tagPerformersHidden: false,
  tagEditBtnHidden: false,
  tagFilters: [{param: null,cond: null,val: null,type: null,flag: null,lock: false,}],
  tagSortBy: 'name',
  tagSortDirection: 'asc',
  tagPage: 1,
  tagFirstChar: [],
  tagColor: [],
  websiteVideoTagsHidden: false,
  websitePerformersHidden: false,
  websiteEditBtnHidden: false,
  websiteFilters: [{param: null,cond: null,val: null,type: null,flag: null,lock: false,}],
  websiteSortBy: 'name',
  websiteSortDirection: 'asc',
  websitePage: 1,
  websiteFirstChar: [],
  websiteColor: [],
  playlistFilters: [{param: null,cond: null,val: null,type: null,flag: null,lock: false,}],
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
  playerType: "0",
  customParametersPerformer: [],
  updateIntervalDataFromVideos: 30,
  autoUpdateDataFromVideos: false,
  updateDataFromVideosOnStart: false,
}).write()

const Settings = {
  state: () => ({
    passwordProtection: dbs.get('passwordProtection').value(),
    phrase: dbs.get('phrase').value(),
    passwordConfirmed: false,
    passwordHint: dbs.get('passwordHint').value(),
    videoPreviewEnabled: dbs.get('videoPreviewEnabled').value(),
    videoPreviewGridEnabled: dbs.get('videoPreviewGridEnabled').value(),
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
    searchTagsInFileName: false,
    scanProcRun: false,
    ratingAndFavoriteInCard: dbs.get('ratingAndFavoriteInCard').value(),
    selectedDisk: dbs.get('selectedDisk').value() || '',
    videoFilters: [{param:null,cond:null,val:null,type:null,flag: null,lock:false}],
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
    performerFilters: [{param:null,cond:null,val:null,type:null,flag: null,lock:false}],
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
    tagsPerPage: dbs.get('tagsPerPage').value() || 20,
    tagAltNamesHidden: dbs.get('tagAltNamesHidden').value() || false,
    tagPerformersHidden: dbs.get('tagPerformersHidden').value() || false,
    tagEditBtnHidden: dbs.get('tagEditBtnHidden').value() || false,
    tagFilters: [{param: null,cond: null,val: null,type: null,flag: null,lock: false,}],
    tagSortBy: 'name',
    tagSortDirection: 'asc',
    tagPage: 1,
    tagFirstChar: [],
    tagColor: [],
    websitesPerPage: dbs.get('websitesPerPage').value() || 20,
    websiteVideoTagsHidden: dbs.get('websiteVideoTagsHidden').value() || false,
    websitePerformersHidden: dbs.get('websitePerformersHidden').value() || false,
    websiteEditBtnHidden: dbs.get('websiteEditBtnHidden').value() || false,
    websiteFilters: [{param: null,cond: null,val: null,type: null,flag: null,lock: false,}],
    websiteSortBy: 'name',
    websiteSortDirection: 'asc',
    websitePage: 1,
    websiteFirstChar: [],
    websiteColor: [],
    playlistsPerPage: dbs.get('playlistsPerPage').value() || 20,
    playlistFilters: [{param: null,cond: null,val: null,type: null,flag: null,lock: false,}],
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
    websitesFiltersPresetDefault: dbs.get('websitesFiltersPresetDefault').value(),
    dialogHeaderGradient: false,
    gapSize: dbs.get('gapSize').value(),
    playerType: dbs.get('playerType').value() || '0',
    dialogManagePerformerParameters: false,
    customParametersPerformer: _.cloneDeep(dbs.get('customParametersPerformer').value()),
    updateIntervalDataFromVideos: dbs.get('updateIntervalDataFromVideos').value(),
    autoUpdateDataFromVideos: dbs.get('autoUpdateDataFromVideos').value(),
    updateDataFromVideosOnStart: dbs.get('updateDataFromVideosOnStart').value(),
  }),
  mutations: {
    updateSettings (state) {
      console.log(':::::::settings UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    updateBackups(state, value) {
      state.backups = value
    },
    addNewTab(state, tab) {
      state.tabs.push(tab)
    },
    closeTab(state, tabId) {
      state.tabs = _.filter(state.tabs, tab => tab.id !== tabId)
    },
    getTabsFromDb(state, tabs) {
      state.tabs = _.cloneDeep(dbs.get('tabs').value())
    },
    updateTabs(state, tabs) {
      state.tabs = _.cloneDeep(tabs)
    },
    updateFiltersPresetDefault(state, {type, value}) {
      state[`${type}FiltersPresetDefault`] = value
    },
    resetSettingsToDefault(state) {
      state.passwordProtection = false
      state.appColorLightPrimary = '#ef0051'
      state.appColorLightSecondary = '#d80155'
      state.appColorLightAccent = '#14db00'
      state.appColorLightHeader = '#ff0f60'
      state.appColorDarkPrimary = '#2175ab'
      state.appColorDarkSecondary = '#3797cd'
      state.appColorDarkAccent = '#84329e'
      state.appColorDarkHeader = '#2b6c90'
      state.darkMode = false
      state.headerGradient = true
      state.headerGradientLight = 'linear-gradient(to right, #00ffff, #ff9800, #7a00ff)'
      state.headerGradientDark = 'linear-gradient(to right, #0033a5, #c30059, #C5A401)'
      state.textFont = 'Roboto'
      state.headerFont = 'Roboto'
      state.navigationSide = "1"
      state.numberOfPagesLimit = 7
      state.videoCardSize = 3
      state.performerCardSize = 3
      state.performerChipsColored = true
      state.performerEditBtnHidden = false
      state.performerMeterHidden = false
      state.performerNameHidden = false
      state.performerRatingHidden = false
      state.performerNationalityHidden = false
      state.performerFavoriteHidden = false
      state.performerProfileProgressHidden = false
      state.performerAliasesHidden = false
      state.performerCareerStatusHidden = false
      state.performerTagsHidden = false
      state.performerVideoTagsHidden = false
      state.performerWebsitesHidden = false
      state.performerProfile = false
      state.performerProfileTags = true
      state.performerProfileWebsites = true
      state.selectedDisk = ''
      state.videoChipsColored = true
      state.videoEditBtnHidden = false
      state.videoFileNameHidden = false
      state.videoFileInfoHidden = false
      state.videoRatingHidden = false
      state.videoFavoriteHidden = false
      state.videoQualityLabelHidden = false
      state.videoDurationHidden = false
      state.videoPerformersHidden = false
      state.videoTagsHidden = false
      state.ratingAndFavoriteInCard = false
      state.videoPreviewEnabled = true
      state.videoPreviewGridEnabled = false
      state.tagAltNamesHidden = false
      state.tagPerformersHidden = false
      state.tagEditBtnHidden = false
      state.websiteVideoTagsHidden = false
      state.websitePerformersHidden = false
      state.websiteEditBtnHidden = false
      state.gapSize = 's'
      state.playerType = '0'
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
      commit('addNewTab', tab)
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
    resetSettingsToDefault({state, rootState, commit, dispatch, getters}) {
      getters.settings.assign({
        passwordProtection: false,
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
        selectedDisk: '',
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
        videoPreviewEnabled: true,
        videoPreviewGridEnabled: false,
        tagAltNamesHidden: false,
        tagPerformersHidden: false,
        tagEditBtnHidden: false,
        websiteVideoTagsHidden: false,
        websitePerformersHidden: false,
        websiteEditBtnHidden: false,
        gapSize: 's',
        playerType: '0',
      }).write()
      commit('resetSettingsToDefault')
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
    getSearchTagsInFileName(state) {
      return state.searchTagsInFileName
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