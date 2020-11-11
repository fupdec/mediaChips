<template>
  <v-app v-if="!$store.state.Settings.disableRunApp" :class="[textFont, headerFont]">
    <SystemBar />

    <AppBar />

    <SideBar />

    <v-main app>
      <keep-alive include="Performers,Videos">
        <router-view />
      </keep-alive>
    </v-main>

    <BottomBar />

    <VideosGridElements />
    <SnackBar />

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

import FilterVideos from '@/mixins/FilterVideos'

export default {
  name: 'App',
  components: {
    SystemBar: () => import('@/components/app/SystemBar.vue'),
    AppBar: () => import('@/components/app/AppBar.vue'),
    SideBar: () => import('@/components/app/SideBar.vue'),
    StatusBar: () => import('@/components/app/StatusBar.vue'),
    SnackBar: () => import('@/components/app/SnackBar.vue'),
    BottomBar: () => import('@/components/app/BottomBar.vue'),
    VideosGridElements: () => import('@/components/elements/VideosGridElements.vue'),
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
    })
  },
  data: () => ({
    isShowVideoBtn: false,
    isShowPerformerBtn: false,
    videoPage: '/',
    performerPage: '/',
  }),
  computed: {
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
// TODO: Posibility to save filters. maybe need new DB for filters
</script>


<style lang="sass">
  @import '@/assets/styles/app.scss'
  // @import '@/styles/variables.scss'
</style>