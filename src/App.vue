<template>
  <v-app :class="[textFont, headerFont, {'color-scroll': colorScroll}]">
    <SystemBar v-show="showSystemBar" :disableRunApp="disableRunApp" @lock="lock" @about="about=true" @checkForUpdates="checkForUpdates"/>

    <AppBar />

    <SideBar v-if="navigationSide=='1'" @openDialogFolder="openDialogFolder" :foldersUpdated="foldersUpdated"/>

    <v-main app v-if="!disableRunApp">
      <router-view :key="$route.fullPath" />
    </v-main>

    <v-dialog v-if="disableRunApp" v-model="disableRunApp" scrollable persistent width="500" overlay-opacity="1">
      <v-form ref="pass" v-model="validPass" lazy-validation @submit.prevent>
        <v-card>
          <v-toolbar color="primary">
            <div class="headline">Welcome!</div>
            <v-spacer></v-spacer>
            <v-btn @click="close" outlined class="mx-4"> <v-icon left>mdi-logout</v-icon>Exit</v-btn>
            <v-btn @click="logIn" outlined> <v-icon left>mdi-login</v-icon> Log in </v-btn>
          </v-toolbar>
          <v-card-text>
            <v-alert type="warning" text dense>Password required to enter the application</v-alert>
            <v-text-field
              v-model="password" :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :rules="[getPasswordRules]" :type="showPassword ? 'text' : 'password'" 
              label="Password" :hint="passwordHint" validate-on-blur
              @click:append="showPassword = !showPassword" @keyup.enter="logIn"
            />
            <v-alert v-model="errorPass" text dense type="error" icon="mdi-alert" class="mt-6">
              Wrong password
            </v-alert>
          </v-card-text>
        </v-card>
      </v-form>
    </v-dialog>

    <v-dialog v-model="about" width="500">
      <v-card>
        <v-toolbar color="primary">
          <div class="headline">About application</div>
          <v-spacer></v-spacer>
          <v-icon>mdi-information-variant</v-icon>
        </v-toolbar>
        <v-card-text class="pa-4">
          <About/>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-bottom-sheet v-if="isNewVersionAvailable" v-model="isNewVersionAvailable" hide-overlay no-click-animation persistent width="600">
      <v-card class="pb-6">
        <v-card-title>
          <span>New version {{versions.new.replace(/ /gm,'')}} is available!</span>
          <v-spacer></v-spacer>
          <img alt="MediaChips" width="60" height="60" :src="logoPath">
        </v-card-title>
        <v-card-actions class="pa-0">
          <v-btn @click="isNewVersionAvailable=false" class="ma-4">
            <v-icon left>mdi-close</v-icon> Close
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="openLink('https://mediachips.app/downloads/')" color="primary" class="mr-4">
            <v-icon left>mdi-download</v-icon> Download from official website </v-btn>
        </v-card-actions>
      </v-card>
    </v-bottom-sheet>

    <BottomBar v-if="navigationSide=='2'" @openDialogFolder="openDialogFolder" :foldersUpdated="foldersUpdated"/>

    <ContextMenu />

    <VideosGridElements />

    <ScanVideos v-if="$store.state.Settings.dialogScanVideos"/>

    <img v-show="$store.state.hoveredImage" class="list-img-preview"
      :src="getHoveredImage" height="160" max-width="160"
      :style="`top:${$store.state.hoveredImageY+30}px;left:${$store.state.hoveredImageX+30}px;`"/>

    <!-- Console Logs -->
    <v-bottom-sheet :value="isLogVisible" ref="sheet" :retain-focus="false"
      content-class="console console-log" hide-overlay no-click-animation persistent>
      <v-sheet>
        <div class="px-4 py-1 d-flex justify-space-between">
          <span class="d-flex align-center"><v-icon left>mdi-notebook-outline</v-icon>Logs</span>
          <span>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn v-on="on" @click="clearLogs" icon small class="mx-4">
                  <v-icon size="20">mdi-delete-variant</v-icon> 
                </v-btn>
              </template>
              <span>Clear Logs</span>
            </v-tooltip>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn v-on="on" @click="scrollToTop" icon small class="ml-4">
                  <v-icon>mdi-arrow-up</v-icon> 
                </v-btn>
              </template>
              <span>Scroll to Top</span>
            </v-tooltip>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn v-on="on" @click="scrollToBottom" icon small class="mx-4">
                  <v-icon>mdi-arrow-down</v-icon> 
                </v-btn>
              </template>
              <span>Scroll to Bottom</span>
            </v-tooltip>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn v-on="on" @click="$store.state.isLogVisible=false" icon small class="ml-4">
                  <v-icon>mdi-close</v-icon> 
                </v-btn>
              </template>
              <span>Close</span>
            </v-tooltip>
          </span>
        </div>
        <v-divider></v-divider>
        <vuescroll ref="logs">
          <v-list height="200" class="pa-0">
            <v-list-item v-for="(log, i) in $store.state.log" :key="i" class="string">
              <span>
                <span class="type" :class="[log.type]">{{log.type}}</span>
                <span class="text" :class="[log.color+'--text']" v-html="log.text"/>
              </span>
              <span class="time text--secondary">{{msToTime(log.time)}}</span>
            </v-list-item>
          </v-list>
        </vuescroll>
      </v-sheet>
    </v-bottom-sheet>

    <DialogFolder v-if="$store.state.dialogFolder" @addNewVideos="addNewVideos" :folder="folder"/>
    <Migration v-if="isMigrationNeeded" :versions="versions"/>

    <v-footer app height="20" class="pa-0 footer-app">
      <StatusBar />
    </v-footer>
  </v-app>
</template>


<script>
console.clear()
const fs = require('fs-extra')
const path = require('path')
const {ipcRenderer} = require('electron')
const axios = require("axios")
const cheerio = require("cheerio")
const shell = require('electron').shell
const chokidar = require('chokidar')
const shortid = require('shortid')

import HoveredImageFunctions from '@/mixins/HoveredImageFunctions'
import PlayerEvents from '@/mixins/PlayerEvents'
import vuescroll from 'vuescroll'

export default {
  name: 'App',
  components: {
    SystemBar: () => import('@/components/app/SystemBar.vue'),
    AppBar: () => import('@/components/app/AppBar.vue'),
    SideBar: () => import('@/components/app/SideBar.vue'),
    StatusBar: () => import('@/components/app/StatusBar.vue'),
    BottomBar: () => import('@/components/app/BottomBar.vue'),
    DialogFolder: () => import('@/components/app/DialogFolder.vue'),
    ContextMenu: () => import('@/components/app/ContextMenu.vue'),
    VideosGridElements: () => import('@/components/elements/VideosGridElements.vue'),
    ScanVideos: () => import('@/components/pages/settings/ScanVideos.vue'),
    About: () => import('@/components/app/About.vue'),
    Migration: () => import('@/components/app/Migration.vue'),
    vuescroll,
  },
  mixins: [HoveredImageFunctions, PlayerEvents],
  mounted() {
    this.$nextTick(async () => {
      this.$store.commit('addLog', { text: '🚀 Application launched', color: 'green' })
      this.initTheme()
      await this.initSystemInfo()
      if (this.checkIsMigrationNeeded()) return
      // this.initPlugins()
      if (this.$store.state.Settings.checkForUpdatesAtStartup) this.checkForUpdates()
      this.$router.push({ path: '/home', query: { name: 'Home' } })
      this.runAutoUpdateDataFromVideos()
      if (this.$store.state.Settings.updateDataFromVideosOnStart) this.updateDataFromVideos()
      if (this.passwordProtection && this.phrase!=='') this.disableRunApp = this.phrase !== this.password 
      if (this.watchFolders) this.watchDir(this.folders.map(f=>f.path)) // watch folders for new videos, deleted videos
      setInterval(() => { this.createBackup() }, 1000 * 60 * 30) // every 30 minutes
      // ipcRenderer.on('getPlugin', (event, data) => { console.log(data) })
    }) // TODO: disable shift+enter and shift+click because that add new window
  },
  beforeDestroy() {
    clearInterval(this.intervalUpdateDataFromVideos)
  },
  data: () => ({
    password: '',
    showPassword: false,
    disableRunApp: false,
    isShowVideoBtn: false,
    validPass: false,
    errorPass: false,
    intervalUpdateDataFromVideos: null,
    folder: null,
    watcher: null,
    foldersUpdated: false,
    extensions: ['.3gp','.avi','.dat','.f4v','.flv','.m4v','.mkv','.mod','.mov','.mp4','.mpeg','.mpg','.mts','.m2ts','.rm','.rmvb','.swf','.ts','.vob','.webm','.wmv','.yuv'],
    about: false,
    isNewVersionAvailable: false,
    isMigrationNeeded: false,
    versions: {
      db: '',
      app: '',
      new: '',
      migration: [],
    },
  }),
  computed: {
    showSystemBar() {return process.platform === 'win32'},
    colorScroll() {return this.$store.state.Settings.colorScroll},
    passwordProtection() {return this.$store.state.Settings.passwordProtection},
    phrase() {return this.$store.state.Settings.phrase},
    passwordHint() {return this.$store.state.Settings.passwordHint},
    textFont() {return 'text-font-' + this.$store.state.Settings.textFont.toLowerCase()},
    headerFont() {return 'header-font-' + this.$store.state.Settings.headerFont.toLowerCase()},
    darkMode: {
      get() {return this.$store.state.Settings.darkMode},
      set(value) {
        this.$vuetify.theme.dark = value
        this.$store.dispatch('updateSettingsState', {key:'darkMode', value})
      },
    },
    navigationSide() {return this.$store.state.Settings.navigationSide},
    hoveredImageId() {return this.$store.state.hoveredImageId},
    getHoveredImage() {
      let imgType = this.$store.state.hoveredImageType
      // if (imgType === 'performer') return this.getImgPerformersUrl(this.hoveredImageId)
      // if (imgType === 'tag') return this.getImgTagsUrl(this.hoveredImageId)
      // if (imgType === 'website') return this.getImgWebsiteUrl(this.hoveredImageId)
      if (imgType === 'meta') return this.getImgMetaUrl(this.hoveredImageId, this.$store.state.hoveredImageMetaId)
    },
    logoPath() {return path.join('file://', __static, '/icons/icon.png')},
    updateIntervalDataFromVideos() {return this.$store.state.Settings.updateIntervalDataFromVideos},
    autoUpdateDataFromVideos() {return this.$store.state.Settings.autoUpdateDataFromVideos},
    folders() {return _.cloneDeep(this.$store.state.Settings.folders.filter(i=>i.watch))},
    foldersData() {return this.$store.state.foldersData},
    watchFolders() {return this.$store.state.Settings.watchFolders},
    updateFoldersData() {return this.$store.state.updateFoldersData},
    isLogVisible() {return this.$store.state.isLogVisible},
    databaseVersion() {return this.$store.state.Settings.databaseVersion},
    pathToUserData() { return this.$store.getters.getPathToUserData },
  },
  methods: {
    scrollToTop() {this.$refs.logs.scrollTo({ y: '0%' }, 300)},
    scrollToBottom() {this.$refs.logs.scrollTo({ y: '100%' }, 300)},
    msToTime(ms) {
      let date = new Date(ms)
      return date.toLocaleDateString() + ', ' + date.toLocaleTimeString()
    },
    clearLogs() {
      this.$store.state.log = []
      this.$store.state.isLogVisible = false
      this.$store.commit('addLog', {
        type: 'info',
        text: `The logs have been removed`
      })
    },
    watchDir(dir) {
      // ++this.$store.state.backgroundProcesses
      this.watcher = chokidar.watch(dir, {
        persistent: true,
        ignoreInitial: true,
      })
      this.watcher
        .on('add', path => this.addFile(path))
        .on('change', path => this.removeFile(path))
        .on('unlink', path => this.removeFile(path))
        .on('ready', () => this.getAllFiles(this.watcher.getWatched()))
    },
    addFile(filePath) {
      if ( !this.extensions.includes( path.extname( filePath.toLowerCase() ) ) ) return

      let data = this.$store.state.foldersData 
      for (let i=0; i<data.length; i++) { 
        if (data[i].newFiles.includes(filePath)) return // check for duplicates
      }

      this.foldersUpdated = false 
      this.getAllFiles(this.watcher.getWatched())
      
      this.$store.commit('addLog', {
        type: 'info',
        text: `File ${filePath} has been added`
      })
    },
    removeFile(filePath) {
      if ( !this.extensions.includes( path.extname( filePath.toLowerCase() ) ) ) return

      let data = this.$store.state.foldersData 
      for (let i=0; i<data.length; i++) { 
        if (data[i].lostFiles.includes(filePath)) return // check for duplicates
      }

      this.foldersUpdated = false 
      this.getAllFiles(this.watcher.getWatched())
      this.$store.commit('addLog', {
        type: 'info',
        text: `File ${filePath} has been removed`
      })
    },
    getAllFiles(dirs) {
      let files = []
      for (let d in dirs) { // get all paths from watched directories
        if (dirs[d].length) {
          for (let i=0; i<dirs[d].length; i++) {
            let filePath = path.join(d, dirs[d][i])
            if ( this.extensions.includes( path.extname( filePath.toLowerCase() ) ) )
            files.push(filePath)
          }
        }
      }
      this.$store.state.foldersData = []
      for (let i=0; i<this.folders.length; i++) { // get compared paths
        let folderPath = this.folders[i].path
        let filesInDb = this.$store.getters.videos.filter(v=>v.path.includes(folderPath)).map('path').value()
        let filesInFolder = files.filter(x => x.includes(folderPath))
        let lostFiles = filesInDb.filter(x => !filesInFolder.includes(x))
        let newFiles = filesInFolder.filter(x => !filesInDb.includes(x))
        this.$store.state.foldersData.push({
          folder: folderPath,
          lostFiles: lostFiles.sort((a, b) => a.localeCompare(b)),
          newFiles: newFiles.sort((a, b) => a.localeCompare(b))
        })
      }
      this.foldersUpdated = true
      // --this.$store.state.backgroundProcesses
      // TODO fix number of background process for watched folders
    },
    runAutoUpdateDataFromVideos() {
      if (this.autoUpdateDataFromVideos) {
        if (this.intervalUpdateDataFromVideos) {
          clearInterval(this.intervalUpdateDataFromVideos) 
        }
        this.intervalUpdateDataFromVideos = setInterval(()=>{
          this.updateDataFromVideos()
        }, this.updateIntervalDataFromVideos * 60 * 1000)
      } else clearInterval(this.intervalUpdateDataFromVideos) 
    },
    updateDataFromVideos() {
      let bpId = shortid.generate()
      let bp = { id: bpId, text: 'Updating number of videos', icon: 'video', }
      this.$store.commit('addBackgroundProcess', bp)
      setTimeout(() => {
        this.$store.dispatch('updateDataFromVideos')
        this.$store.commit('removeBackgroundProcess', bpId)
        this.$store.commit('addLog', {type:'info',text:`Data from videos updated`})
      }, 1000)
    },
    lock() {
      this.disableRunApp = true
      this.password = ''
    },
    close() {
      ipcRenderer.send('closeApp')
    },
    initTheme() {
      this.$vuetify.theme.dark = this.$store.state.Settings.darkMode
      this.$vuetify.theme.themes.light.primary = this.$store.state.Settings.appColorLightPrimary
      this.$vuetify.theme.themes.light.secondary = this.$store.state.Settings.appColorLightSecondary
      this.$vuetify.theme.themes.light.accent = this.$store.state.Settings.appColorLightAccent
      this.$vuetify.theme.themes.dark.primary = this.$store.state.Settings.appColorDarkPrimary
      this.$vuetify.theme.themes.dark.secondary = this.$store.state.Settings.appColorDarkSecondary
      this.$vuetify.theme.themes.dark.accent = this.$store.state.Settings.appColorDarkAccent
    },
    async initSystemInfo() {
      this.versions.db = this.databaseVersion
      await ipcRenderer.invoke('getAppVersion').then((result) => {
        this.versions.app = result
      })
      await ipcRenderer.invoke('getPathToUserData').then((result) => {
        this.$store.state.pathToUserData = result
      })
    },
    checkIsMigrationNeeded() {
      if (this.versions.db === this.versions.app) return false
      
      let verReqMigration = ['0.10.4','0.11.1']
      
      for (let i = 0; i < verReqMigration.length; i++) {
        if (this.getVer(this.versions.db) < this.getVer(verReqMigration[i])) {
          this.versions.migration = verReqMigration.slice(i)
          break
        }
      }

      if (this.versions.migration.length) {
        this.isMigrationNeeded = true
        return true
      } else {
        this.$store.dispatch('updateSettingsState', {key:'databaseVersion', value:this.versions.app})
        return false
      }
    },
    getVer(version) { return version.split('.').map( s => s.padStart(10) ).join('.') },
    getPasswordRules(pass) {
      if (pass.length > 100) return 'Password must be less than 100 characters'
      else if (pass.length===0) return 'Password is required' 
      else return true
    },
    logIn() {
      this.$refs.pass.validate()
      this.errorPass = this.phrase !== this.password 
      this.disableRunApp = this.phrase !== this.password 
    },
    checkForUpdates() {
      axios.get(`https://github.com/fupdec/MediaChips/releases`).then((response) => {
        if (response.status === 200) {
          const html = response.data
          const $ = cheerio.load(html)
          this.versions.new = $('a:contains("MediaChips v")').eq(0).text().trim() // from github
          this.versions.new = this.versions.new.match(/\d{1,2}.\d{1,2}.\d{1,2}/)[0]
          if (this.getVer(this.versions.app) < this.getVer(this.versions.new)) {
            this.$store.commit('addLog',{text:`💿 Available new version: ${this.versions.new}`, color:'green'})
            this.isNewVersionAvailable = true
          } else this.$store.commit('addLog', { text: 'Checking for updates is complete. You are using the latest version of the application.', type: 'info' })
        } else this.$store.commit('addLog', { text: 'An internet connection error occurred while checking for updates', type: 'error' })
      })
    },
    openLink(link) {
      shell.openExternal(link)
    },
    openDialogFolder(folder) {
      const index = _.findIndex(this.foldersData, {folder})
      this.folder = this.foldersData[index]
      this.$store.state.dialogFolder = true
    },
    addNewVideos() {
      this.$store.state.scan.files = this.folder.newFiles
      this.$store.state.scan.stage = 2
      this.$store.state.Settings.dialogScanVideos = true
    },
    createBackup() {
      let temp = path.join(this.pathToUserData, 'backups', 'temp')
      if (!fs.existsSync(temp)) fs.mkdirSync(temp)
      let settings = path.join(this.pathToUserData, 'dbs.json')
      try { fs.copySync(settings, path.join(temp, 'dbs.json')) } 
      catch (err) { console.error(err) }
      let databases = path.join(this.pathToUserData, 'databases')
      try { fs.copySync(databases, temp) } 
      catch (err) { console.error(err) }
    },
    // initPlugins() {
    //   const pluginsDir = path.resolve(this.pathToUserData, 'plugins')
    //   ipcRenderer.send('installPlugin', pluginsDir)
    // },
  },
  watch: {
    updateIntervalDataFromVideos(n) { this.runAutoUpdateDataFromVideos() },
    autoUpdateDataFromVideos(n) { this.runAutoUpdateDataFromVideos() },
    folders(folders) {
      if (!this.watchFolders) return
      this.foldersUpdated = false 
      this.watcher.close().then(() => this.watchDir(folders.map(f=>f.path)))
    },
    watchFolders(watchFolders) {
      if (watchFolders) this.watchDir(this.folders.map(f=>f.path))
      else this.watcher.close()
    },
    updateFoldersData() {
      if (!this.watchFolders) return
      this.foldersUpdated = false 
      this.getAllFiles(this.watcher.getWatched())
    },
    isLogVisible(newValue) {
      if (newValue) setTimeout(() => {
        this.$refs.logs.scrollTo({ y: '100%' }, 0)
      }, 100)
      this.$nextTick(() => { this.$refs.sheet.showScroll() })
    },
  },
}
</script>


<style lang="sass">
  @import '@/assets/styles/app.scss'
  // @import '@/styles/variables.scss'
</style>