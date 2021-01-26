<template>
  <v-app :class="[textFont, headerFont]">
    <SystemBar :disableRunApp="disableRunApp" @lock="lock"/>

    <AppBar />

    <SideBar />

    <v-main app v-if="!disableRunApp">
      <router-view :key="$route.name + ($route.params.id || '')" />
    </v-main>

    <v-dialog v-model="disableRunApp" scrollable persistent width="400" overlay-opacity="1">
      <v-form ref="pass" v-model="validPass" lazy-validation @submit.prevent>
        <v-card>
          <v-card-title primary-title class="headline">
            <div>Log in to the application</div>
            <v-spacer></v-spacer>
            <v-icon>mdi-account-box</v-icon>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="mt-6 mb-4">Password required to enter the application</div>
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
          <v-card-actions class="pt-0">
            <v-btn @click="close" class="ma-4">
              <v-icon left>mdi-logout</v-icon>Exit
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn @click="logIn" color="primary" class="ma-4">
              <v-icon left>mdi-login</v-icon> Log in
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>

    <v-bottom-sheet v-model="updateApp" hide-overlay no-click-animation persistent width="600">
      <v-card class="pb-8">
        <v-card-text class="text-center">
          <div class="overline py-4">New version AVDB is available!</div>
          <img alt="AMDB" width="100" height="100" :src="logoPath">
        </v-card-text>
        <v-card-actions>
          <v-btn @click="updateApp=false" small class="mx-4">
            <v-icon left>mdi-close</v-icon> Ok
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="openPage" color="primary" small class="mx-4">
            <v-icon left>mdi-download</v-icon> Open page with downloads
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-bottom-sheet>

    <BottomBar />

    <VideosGridElements />
    <ScanVideos />

    <img 
      v-show="$store.state.hoveredImage" class="list-img-preview"
      :src="getHoveredImage" height="160" max-width="160"
      :style="`top:${$store.state.hoveredImageY+30}px;left:${$store.state.hoveredImageX+30}px;`"
    />
    <!-- <div class="console-log" :class="{visible: $store.state.isLogVisible}">
      {{$store.state.log}} 
    </div> -->

    <v-footer app height="20" class="py-0 footer-app">
      <StatusBar />
    </v-footer>
  </v-app>
</template>


<script>
console.clear()
const path = require('path')
const {app} = require('electron').remote
const remote = require('electron').remote
const win = remote.getCurrentWindow()
const axios = require("axios")
const cheerio = require("cheerio")
const shell = require('electron').shell

import HoveredImageFunctions from '@/mixins/HoveredImageFunctions'
import PlayerEvents from '@/mixins/PlayerEvents'

export default {
  name: 'App',
  components: {
    SystemBar: () => import('@/components/app/SystemBar.vue'),
    AppBar: () => import('@/components/app/AppBar.vue'),
    SideBar: () => import('@/components/app/SideBar.vue'),
    StatusBar: () => import('@/components/app/StatusBar.vue'),
    BottomBar: () => import('@/components/app/BottomBar.vue'),
    VideosGridElements: () => import('@/components/elements/VideosGridElements.vue'),
    ScanVideos: () => import('@/components/pages/settings/ScanVideos.vue'),
  },
  mixins: [HoveredImageFunctions, PlayerEvents],
  mounted() {
    this.$nextTick(function () {
      this.checkForUpdates()
      this.$store.state.pathToUserData = app.getPath('userData')
      this.$router.push({ path: '/home', query: { name: 'Home' } })
      this.initTheme()
      // password
      if(this.passwordProtection && this.phrase!=='') {
        this.disableRunApp = this.phrase !== this.password 
      }
      // keyboard shortcuts
      // TODO: disable shift+enter and shift+click because that add new window
      window.addEventListener('keyup', event => {
        if(event.altKey && event.keyCode === 83) { // alt+s
          this.$router.push('/settings')
          return
        }
        if(event.altKey && event.keyCode === 86) { // alt+v
          this.$router.push('/videos/:default?tabId=default')
          return
        }
        if(event.altKey && event.keyCode === 82) { // alt+r
          this.$router.push('/performers/:default?tabId=default')
          return
        }
        if(event.altKey && event.keyCode === 84) { // alt+t
          this.$router.push('/tags/:default?tabId=default')
          return
        }
        if(event.altKey && event.keyCode === 87) { // alt+w
          this.$router.push('/websites/:default?tabId=default')
          return
        }
        if(event.altKey && event.keyCode === 80) { // alt+p
          this.$router.push('/playlists')
          return
        }
        if(event.altKey && event.keyCode === 88) { // alt+x
          this.$router.push('/home')
          return
        }
        if(event.altKey && event.keyCode === 68) { // alt+d
          this.darkMode = !this.$store.state.Settings.darkMode
          return
        }
      })
    })
  },
  data: () => ({
    password: '',
    showPassword: false,
    disableRunApp: false,
    isShowVideoBtn: false,
    validPass: false,
    errorPass: false,
    isShowPerformerBtn: false,
    videoPage: '/',
    performerPage: '/',
    updateApp: false,
  }),
  computed: {
    passwordProtection() {
      return this.$store.state.Settings.passwordProtection
    },
    phrase() {
      return this.$store.state.Settings.phrase
    },
    passwordHint() {
      return this.$store.state.Settings.passwordHint
    },
    textFont() {
      return 'text-font-' + this.$store.state.Settings.textFont.toLowerCase()
    },
    headerFont() {
      return 'header-font-' + this.$store.state.Settings.headerFont.toLowerCase()
    },
    darkMode: {
      get() {
        return this.$store.state.Settings.darkMode
      },
      set(value) {
        this.$vuetify.theme.dark = value
        this.$store.dispatch('updateSettingsState', {key:'darkMode', value})
      },
    },
    navigationSide() {
      return this.$store.state.Settings.navigationSide
    },
    hoveredImageId() {
      return this.$store.state.hoveredImageId
    },
    getHoveredImage() {
      let imgType = this.$store.state.hoveredImageType
      if (imgType === 'performer') {
        return this.getImgPerformersUrl(this.hoveredImageId)
      }
      if (imgType === 'tag') {
        return this.getImgTagsUrl(this.hoveredImageId)
      }
      if (imgType === 'website') {
        return this.getImgWebsiteUrl(this.hoveredImageId)
      }
    },
    logoPath() {
      return path.join(__static, '/icons/icon.png')
    },
  },
  methods: {
    lock() {
      this.disableRunApp = true
      this.password = ''
    },
    close() {
      win.close()
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
    getPasswordRules(pass) {
      if (pass.length > 100) {
        return 'Password must be less than 100 characters'
      } else if (pass.length===0) {
        return 'Password is required'
      } else {
        return true
      }
    },
    logIn() {
      this.$refs.pass.validate()
      this.errorPass = this.phrase !== this.password 
      this.disableRunApp = this.phrase !== this.password 
    },
    checkForUpdates() {
      axios.get(`https://github.com/fupdec/Adult-Video-Database/releases`).then((response) => {
        if(response.status === 200) {
          const html = response.data;
          const $ = cheerio.load(html)
          let v = $('.release-header .f1 a').eq(0).text().trim()
          if (v.match(/\d{1,2}.\d{1,2}.\d{1,2}/)[0] > app.getVersion()) this.updateApp = true
        }
      })
    },
    openPage() {
      shell.openExternal('https://github.com/fupdec/Adult-Video-Database/releases')
    },
  },
  watch: {
    $route() {
      this.$store.state.isRouteChanged = true
      this.isShowVideoBtn = this.$router.currentRoute.path.includes('/video/')
      this.videoPage = this.$router.currentRoute
      this.isShowPerformerBtn = this.$router.currentRoute.path.includes('/performer/')
      this.performerPage = this.$router.currentRoute
    }
  },
}
</script>


<style lang="sass">
  @import '@/assets/styles/app.scss'
  // @import '@/styles/variables.scss'
</style>