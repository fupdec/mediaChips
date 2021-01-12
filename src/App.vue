<template>
  <v-app :class="[textFont, headerFont]">
    <SystemBar />

    <AppBar />

    <SideBar />

    <v-main app v-if="!disableRunApp">
      <router-view :key="$route.name + ($route.params.id || '')" />
    </v-main>

    <v-dialog v-model="disableRunApp" scrollable persistent width="400" overlay-opacity="1">
      <v-form ref="pass" v-model="validPass" lazy-validation>
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
              @click:append="showPassword = !showPassword"
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

    <BottomBar />

    <VideosGridElements />
    <ScanVideos />
    <VideoPlayer v-if="$store.state.dialogVideoPlayer" />

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
const {app} = require('electron').remote
const remote = require('electron').remote
const win = remote.getCurrentWindow()

import FilterVideos from '@/mixins/FilterVideos'

export default {
  name: 'App',
  components: {
    SystemBar: () => import('@/components/app/SystemBar.vue'),
    AppBar: () => import('@/components/app/AppBar.vue'),
    SideBar: () => import('@/components/app/SideBar.vue'),
    StatusBar: () => import('@/components/app/StatusBar.vue'),
    BottomBar: () => import('@/components/app/BottomBar.vue'),
    VideosGridElements: () => import('@/components/elements/VideosGridElements.vue'),
    VideoPlayer: () => import('@/components/elements/VideoPlayer.vue'),
    ScanVideos: () => import('@/components/pages/settings/ScanVideos.vue'),
  },
  mixins: [FilterVideos],
  mounted() {
    this.$nextTick(function () {
      this.$store.state.pathToUserData = app.getPath('userData')
      this.$router.push({ path: '/home', query: { name: 'Home' } })
      this.$vuetify.theme.dark = this.$store.getters.darkMode
      this.$vuetify.theme.themes.light.primary = this.$store.getters.appColorLightPrimary
      this.$vuetify.theme.themes.light.secondary = this.$store.getters.appColorLightSecondary
      this.$vuetify.theme.themes.light.accent = this.$store.getters.appColorLightAccent
      this.$vuetify.theme.themes.dark.primary = this.$store.getters.appColorDarkPrimary
      this.$vuetify.theme.themes.dark.secondary = this.$store.getters.appColorDarkSecondary
      this.$vuetify.theme.themes.dark.accent = this.$store.getters.appColorDarkAccent
      if(this.passwordProtection && this.phrase!=='') {
        this.disableRunApp = this.phrase !== this.password 
      }
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
        if(event.altKey && event.keyCode === 88) { // alt+x
          this.$router.push('/home')
          return
        }
        if(event.altKey && event.keyCode === 68) { // alt+d
          this.darkMode = !this.$store.getters.darkMode
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
      return 'text-font-' + this.$store.getters.getTextFont.toLowerCase()
    },
    headerFont() {
      return 'header-font-' + this.$store.getters.getHeaderFont.toLowerCase()
    },
    darkMode: {
      get() {
        return this.$store.getters.darkMode
      },
      set(darkModeValue) {
        this.$vuetify.theme.dark = darkModeValue
        this.$store.dispatch('toggleDarkMode', darkModeValue)
      },
    },
    navigationSide() {
      return this.$store.getters.navigationSide
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
  },
  methods: {
    close() {
      win.close()
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