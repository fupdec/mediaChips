const {app} = require('electron').remote
const path = require("path")
const FileSync = require('@/components/elements/LowDbAdapter')
const pathToDbSettings = path.join(app.getPath('userData'), 'userfiles/dbs.json')
const adapterSettings = new FileSync(pathToDbSettings)
const low = require('lowdb')
const dbs = low(adapterSettings)
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
  darkMode: "0",
  headerGradient: true,
  headerGradientLight: 'linear-gradient(to right, #00ffff, #ff9800, #7a00ff)',
  headerGradientDark: 'linear-gradient(to right, #0033a5, #c30059, #C5A401)',
  textFont: 'Roboto',
  headerFont: 'Roboto',
  navigationSide: "1",
  numberOfPagesLimit: 7,
  videoCardSize: 3,
  performerCardSize: 3,
  performerInfoEthnicity: ["Asian","Black","Caucasian","Hispanic","Latin","White"],
  performerInfoHair: ["Black","Blonde","Brown","Brunette","Grey","Red","White"],
  performerInfoEyes: ["Blue","Brown","Green","Grey","Hazel"],
  performerInfoCups: ["AA","A","B","C","D","DD","DDD","E","EE","EEE","F","FF","G","GG","H","HH","I","J","JJ","K","L","M","N"],
  performerInfoCategory: ["Pornstar","Erotic model","Webcam model","Amateur"],
  performerInfoBoobs: ["Real","Fake"],
  performerInfoBody: ["Slim","Average","Muscular","Athletic","Curvy","Chubby","BBW"],
  performerInfoPussy: ["Puffy","Peachy","Bony","Meaty","Discreet","Universal"],
  performerInfoPussyLips: ["Small","Medium","Big","Huge"],
  performerInfoPussyHair: ["Trimmed","Bald","Bush","Natural"],
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
  performerProfile: '0',
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
  videoEditPerformersSortBy: 'name',
  videoEditTagsSortBy: 'name',
  videoEditWebsitesSortBy: 'name',
  tagAltNamesHidden: false,
  tagPerformersHidden: false,
  tagEditBtnHidden: false,
  websiteVideoTagsHidden: false,
  websitePerformersHidden: false,
  websiteEditBtnHidden: false,
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
}).write()

import router from '@/router'
import Vuetify from '@/plugins/vuetify'

const Settings = {
  state: () => ({
    passwordProtection: dbs.get('passwordProtection').value(),
    phrase: dbs.get('phrase').value(),
    passwordConfirmed: false,
    passwordHint: dbs.get('passwordHint').value(),
    videoPreviewEnabled: dbs.get('videoPreviewEnabled').value(),
    videoPreviewGridEnabled: dbs.get('videoPreviewGridEnabled').value(),
    delayVideoPreview: dbs.get('delayVideoPreview').value(),
    darkMode: Boolean(+dbs.get('darkMode').value()),
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
    videoCardSize: dbs.get('videoCardSize').value(),
    ratingAndFavoriteInCard: dbs.get('ratingAndFavoriteInCard').value(),
    performerCardSize: dbs.get('performerCardSize').value(),
    performerInfoEthnicity: dbs.get('performerInfoEthnicity').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoHair: dbs.get('performerInfoHair').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoEyes: dbs.get('performerInfoEyes').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoCups: dbs.get('performerInfoCups').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoCategory: dbs.get('performerInfoCategory').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoBoobs: dbs.get('performerInfoBoobs').value(),
    performerInfoBody: dbs.get('performerInfoBody').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoPussy: dbs.get('performerInfoPussy').value().sort((a,b)=>a.localeCompare(b)),
    performerInfoPussyLips: dbs.get('performerInfoPussyLips').value(),
    performerInfoPussyHair: dbs.get('performerInfoPussyHair').value().sort((a,b)=>a.localeCompare(b)),
    performerProfile: dbs.get('performerProfile').value(),
    performerProfileTags: dbs.get('performerProfileTags').value(),
    performerProfileWebsites: dbs.get('performerProfileWebsites').value(),
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
  }),
  mutations: {
    updateSettings (state) {
      console.log(':::::::settings UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    changePerformerProfile(state, profile) {
      state.performerProfile = profile
    },
    changePerformerProfileTags(state, value) {
      state.performerProfileTags = value
    },
    changePerformerProfileWebsites(state, value) {
      state.performerProfileWebsites = value
    },
    toggleDarkMode(state, value) {
      state.darkMode = value
    },
    toggleHeaderGradient(state, value) {
      state.headerGradient = value
    },
    toggleNavigationSide(state, value) {
      state.navigationSide = value
    },
    changeAppColorLightPrimary(state, color) {
      state.appColorLightPrimary = color
      Vuetify.framework.theme.themes.light.primary = color
    },
    changeAppColorLightSecondary(state, color) {
      state.appColorLightSecondary = color
      Vuetify.framework.theme.themes.light.secondary = color
    },
    changeAppColorLightAccent(state, color) {
      state.appColorLightAccent = color
      Vuetify.framework.theme.themes.light.accent = color
    },
    changeAppColorLightHeader(state, color) {
      state.appColorLightHeader = color
    },
    changeAppColorDarkPrimary(state, color) {
      state.appColorDarkPrimary = color
      Vuetify.framework.theme.themes.dark.primary = color
    },
    changeAppColorDarkSecondary(state, color) {
      state.appColorDarkSecondary = color
      Vuetify.framework.theme.themes.dark.secondary = color
    },
    changeAppColorDarkAccent(state, color) {
      state.appColorDarkAccent = color
      Vuetify.framework.theme.themes.dark.accent = color
    },
    changeAppColorDarkHeader(state, color) {
      state.appColorDarkHeader = color
    },
    changeTextFont(state, font) {
      state.textFont = font
    },
    changeHeaderFont(state, font) {
      state.headerFont = font
    },
    changeNumberOfPagesLimit(state, number) {
      state.numberOfPagesLimit = number
    },
    changeMeterHeight(state, value) {
      state.meterHeight = value
    },
    changeMeterMultiplier(state, value) {
      state.meterMultiplier = value
    },
    changePathToSystemPlayer(state, value) {
      state.pathToSystemPlayer = value
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
    addItemToPerformerInfoParam(state, {param, value}) {
      state[param].push(value)
      state = state[param].sort((a,b)=>a.localeCompare(b))
    },
    updatePerformerInfoParam(state, {param, value}) {
      state[param] = value
      state = state[param].sort((a,b)=>a.localeCompare(b))
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
      state.darkMode = "0"
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
      state.performerProfile = '0'
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
    },
    updateVideoPreviewEnabled(state, value) {
      state.videoPreviewEnabled = value
    },
    changeDelayVideoPreview(state, value) {
      state.delayVideoPreview = value
    },
  },
  actions: {
    changePasswordProtection({ state, commit, getters}, value) {
      getters.settings.set('passwordProtection', value).write()
      state.passwordProtection = value
    },
    changePhrase({ state, commit, getters}, value) {
      getters.settings.set('phrase', value).write()
      state.phrase = value
    },
    changePasswordHint({ state, commit, getters}, value) {
      getters.settings.set('passwordHint', value).write()
      state.passwordHint = value
    },
    changePerformerProfile({ state, commit, getters}, profile) {
      getters.settings.set("performerProfile", profile).write()
      commit('changePerformerProfile', profile)
    },
    changePerformerProfileWebsites({ state, commit, getters}, value) {
      getters.settings.set("performerProfileWebsites", value).write()
      commit('changePerformerProfileWebsites', value)
    },
    changePerformerProfileTags({ state, commit, getters}, value) {
      getters.settings.set("performerProfileTags", value).write()
      commit('changePerformerProfileTags', value)
    },
    toggleDarkMode({ state, commit, getters}, value) {
      getters.settings.set('darkMode', (+value).toString()).write()
      commit('toggleDarkMode', value)
    },
    toggleHeaderGradient({ state, commit, getters}, value) {
      getters.settings.set('headerGradient', value).write()
      commit('toggleHeaderGradient', value)
    },
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
    toggleNavigationSide({ state, commit, getters}, value) {
      getters.settings.set('navigationSide', value).write()
      commit('toggleNavigationSide', value)
    },
    changeAppColorLightPrimary({ state, commit, getters}, color) {
      getters.settings.set('appColorLightPrimary', color).write()
      commit('changeAppColorLightPrimary', color)
    },
    changeAppColorLightSecondary({ state, commit, getters}, color) {
      getters.settings.set('appColorLightSecondary', color).write()
      commit('changeAppColorLightSecondary', color)
    },
    changeAppColorLightAccent({ state, commit, getters}, color) {
      getters.settings.set('appColorLightAccent', color).write()
      commit('changeAppColorLightAccent', color)
    },
    changeAppColorLightHeader({ state, commit, getters}, color) {
      getters.settings.set('appColorLightHeader', color).write()
      commit('changeAppColorLightHeader', color)
    },
    changeAppColorDarkPrimary({ state, commit, getters}, color) {
      getters.settings.set('appColorDarkPrimary', color).write()
      commit('changeAppColorDarkPrimary', color)
    },
    changeAppColorDarkSecondary({ state, commit, getters}, color) {
      getters.settings.set('appColorDarkSecondary', color).write()
      commit('changeAppColorDarkSecondary', color)
    },
    changeAppColorDarkAccent({ state, commit, getters}, color) {
      getters.settings.set('appColorDarkAccent', color).write()
      commit('changeAppColorDarkAccent', color)
    },
    changeAppColorDarkHeader({ state, commit, getters}, color) {
      getters.settings.set('appColorDarkHeader', color).write()
      commit('changeAppColorDarkHeader', color)
    },
    changeTextFont({ state, commit, getters}, font) {
      getters.settings.set('textFont', font).write()
      commit('changeTextFont', font)
    },
    changeHeaderFont({ state, commit, getters}, font) {
      getters.settings.set('headerFont', font).write()
      commit('changeHeaderFont', font)
    },
    changeNumberOfPagesLimit({ state, commit, getters}, number) {
      getters.settings.set('numberOfPagesLimit', number).write()
      commit('changeNumberOfPagesLimit', number)
    },
    changeMeterHeight ({ state, commit, getters}, value) {
      getters.settings.set('meterHeight', value).write()
      commit('changeMeterHeight', value)
    },
    changeMeterMultiplier ({ state, commit, getters}, value) {
      getters.settings.set('meterMultiplier', value).write()
      commit('changeMeterMultiplier', value)
    },
    changePathToSystemPlayer ({ state, commit, getters}, value) {
      getters.settings.set('pathToSystemPlayer', value).write()
      commit('changePathToSystemPlayer', value)
    },
    updateBackups ({ state, commit, getters}, value) {
      commit('updateBackups', getters.getBackups)
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
        darkMode: "0",
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
        performerProfile: '0',
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
      }).write()
      commit('resetSettingsToDefault')
    },
    updateVideoPreviewEnabled({state, rootState, commit, dispatch, getters}, value) {
      getters.settings.assign({ videoPreviewEnabled: value }).write()
      commit('updateVideoPreviewEnabled', value)
    },
    changeDelayVideoPreview ({ state, commit, getters}, value) {
      getters.settings.set("delayVideoPreview", value).write()
      commit('changeDelayVideoPreview', value)
    },
    addItemToPerformerInfoParam({state, commit, dispatch, getters}, {param, value}) {
      commit('addItemToPerformerInfoParam', {param, value})
      getters.settings.set(param, state[param]).write()
    },
    updatePerformerInfoParam({state, rootState, commit, dispatch, getters}, {param, value}) {
      getters.settings.set(param, value).write()
      commit('updatePerformerInfoParam', {param, value})
    },
    updateSettingsState({state, rootState, commit, dispatch, getters}, {key, value}) {
      getters.settings.set(key, value).write()
      state[key] = value
    },
  },
  getters: {
    dbs(state) {
      return state.lastChanged, dbs
    },
    settings(state, store) {
      return store.dbs
    },
    phrase(state) {
      return state.phrase
    },
    passwordProtection(state) {
      return state.passwordProtection
    },
    passwordHint(state) {
      return state.passwordHint
    },
    performerProfile(state) {
      return state.performerProfile
    },
    performerProfileTags(state) {
      return state.performerProfileTags
    },
    performerProfileWebsites(state) {
      return state.performerProfileWebsites
    },
    darkMode(state) {
      return state.darkMode
    },
    headerGradient(state) {
      return state.headerGradient
    },
    navigationSide(state) {
      return state.navigationSide
    },
    appColorLightPrimary(state) {
      return state.appColorLightPrimary
    },
    appColorLightSecondary(state) {
      return state.appColorLightSecondary
    },
    appColorLightAccent(state) {
      return state.appColorLightAccent
    },
    appColorLightHeader(state) {
      return state.appColorLightHeader
    },
    appColorDarkPrimary(state) {
      return state.appColorDarkPrimary
    },
    appColorDarkSecondary(state) {
      return state.appColorDarkSecondary
    },
    appColorDarkAccent(state) {
      return state.appColorDarkAccent
    },
    appColorDarkHeader(state) {
      return state.appColorDarkHeader
    },
    getTextFont(state) {
      return state.textFont
    },
    getHeaderFont(state) {
      return state.headerFont
    },
    getNumberOfPagesLimit(state) {
      return state.numberOfPagesLimit
    },
    getSearchTagsInFileName(state) {
      return state.searchTagsInFileName
    },
    getBackups(state, store) {
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