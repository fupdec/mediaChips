<template>   
  <v-system-bar window app :class="{maximized:maximized}" :style="{background: headerColor}">
    <img src="/icons/icon.png" alt="avdb" width="16" height="16">
    <div class="app-menu-container">
      <v-menu bottom offset-y min-width="160">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" :ripple="false" small tile text height="28">
            Application
          </v-btn>
        </template>
        <v-list dense class="context-menu">
          <v-list-item link @click="$store.state.Settings.dialogScanVideos=true">
            <v-list-item-title>
              <v-icon left size="18">mdi-video-plus</v-icon> Add New Videos
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="playerType=playerType=='0'?'1':'0'">
            <v-list-item-title>
              <v-icon left size="18">mdi-television-play</v-icon> Play Video in System Player
            </v-list-item-title>
            <v-icon size="20" class="ml-6" :color="playerType=='1'?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
          </v-list-item>
          <v-divider class="ma-1"></v-divider>
          <v-list-item link @click="lock" v-if="$store.state.Settings.passwordProtection">
            <v-list-item-title>
              <v-icon left size="18">mdi-lock</v-icon> Lock
              <span></span>
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="restart">
            <v-list-item-title>
              <v-icon left size="18">mdi-restart</v-icon> Restart
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="close">
            <v-list-item-title>
              <v-icon left size="18">mdi-logout</v-icon> Exit
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu bottom offset-y min-width="160">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" :ripple="false" small tile text height="28">
            View
          </v-btn>
        </template>
        <v-list dense class="context-menu">
          <v-menu open-on-hover offset-x nudge-top="3" min-width="150" >
            <template v-slot:activator="{ on, attrs }">
              <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
                <v-list-item-title> 
                  <v-icon left size="18">mdi-format-list-bulleted</v-icon> Navigation Bar
                </v-list-item-title>
                <v-icon size="22">mdi-menu-right</v-icon>
              </v-list-item>
            </template>
            
            <v-list dense class="context-menu">
              <v-list-item @click="$store.dispatch('updateSettingsState', {key:'navigationSide', value: '1'})" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-border-left-variant</v-icon> Side
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="$store.dispatch('updateSettingsState', {key:'navigationSide', value: '2'})" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-border-bottom-variant</v-icon> Bottom
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="$store.dispatch('updateSettingsState', {key:'navigationSide', value: '0'})" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-border-none-variant</v-icon> None
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-menu open-on-hover offset-x nudge-top="3" min-width="150" >
            <template v-slot:activator="{ on, attrs }">
              <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
                <v-list-item-title> 
                  <v-icon left size="18">mdi-arrow-expand-horizontal</v-icon> Gap in Card Grid
                </v-list-item-title>
                <v-icon size="22">mdi-menu-right</v-icon>
              </v-list-item>
            </template>
            
            <v-list dense class="context-menu">
              <v-list-item @click="updateGutterSize('xs')" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-size-xs</v-icon> Extra Small
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="updateGutterSize('s')" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-size-s</v-icon> Small
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="updateGutterSize('m')" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-size-m</v-icon> Medium
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="updateGutterSize('l')" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-size-l</v-icon> Large
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="updateGutterSize('xl')" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-size-xl</v-icon> Extra Large
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-list-item class="pr-1" link @click="ratingAndFavoriteInCard=!ratingAndFavoriteInCard">
            <v-list-item-title>
              <v-icon left size="18">mdi-star</v-icon> Rating and Favorite in Description
            </v-list-item-title>
            <v-icon size="20" class="ml-6" :color="ratingAndFavoriteInCard?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
          </v-list-item>
          <v-list-item class="pr-1" link @click="videoPreview=!videoPreview">
            <v-list-item-title>
              <v-icon left size="18">mdi-video-box</v-icon> Video Preview on Hover
            </v-list-item-title>
            <v-icon size="22" class="ml-6" :color="videoPreview?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
          </v-list-item>
          <v-divider class="ma-1"></v-divider>
          <v-list-item class="pr-2" link @click="toggleDarkMode">
            <v-list-item-title>
              <v-icon left size="18">mdi-theme-light-dark</v-icon>
              <div class="shortcut"><span>Toggle Dark Mode</span> <span>Alt + D</span></div>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu v-if="!disableRunApp" bottom offset-y min-width="160">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" :ripple="false" small tile text height="28">
            Navigation
          </v-btn>
        </template>
        <v-list dense class="context-menu">
          <v-list-item link @click="$router.push('/home')">
            <v-list-item-title>
              <v-icon left size="18">mdi-home</v-icon> 
              <div class="shortcut"><span>Home</span> <span>Alt + X</span></div>
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="$router.push('/videos/:default?tabId=default')">
            <v-list-item-title>
              <v-icon left size="18">mdi-video</v-icon> 
              <div class="shortcut"><span>Videos</span> <span>Alt + V</span></div>
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="$router.push('/performers/:default?tabId=default')">
            <v-list-item-title>
              <v-icon left size="18">mdi-account</v-icon> 
              <div class="shortcut"><span>Performers</span> <span>Alt + R</span></div>
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="$router.push('/tags/:default?tabId=default')">
            <v-list-item-title>
              <v-icon left size="18">mdi-tag</v-icon> 
              <div class="shortcut"><span>Tags</span> <span>Alt + T</span></div>
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="$router.push('/websites/:default?tabId=default')">
            <v-list-item-title>
              <v-icon left size="18">mdi-web</v-icon> 
              <div class="shortcut"><span>Websites</span> <span>Alt + W</span></div>
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="$router.push('/playlists/:default?tabId=default')">
            <v-list-item-title>
              <v-icon left size="18">mdi-format-list-bulleted</v-icon> 
              <div class="shortcut"><span>Playlists</span> <span>Alt + P</span></div>
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="$router.push('/settings')">
            <v-list-item-title>
              <v-icon left size="18">mdi-cog</v-icon> 
              <div class="shortcut"><span>Settings</span> <span>Alt + S</span></div>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn v-if="!disableRunApp" @click="back" text tile small width="46" height="28" class="ml-6">
        <v-icon size="18" class="ma-0">mdi-arrow-left</v-icon>
      </v-btn>
      <v-btn v-if="!disableRunApp" @click="forward" text tile small width="46" height="28">
        <v-icon size="18" class="ma-0">mdi-arrow-right</v-icon>
      </v-btn>
    </div>
    <v-spacer></v-spacer>
    <span class="app-system-bar-title">{{$route.name + ' - '}}Adult Video Database</span>
    <v-spacer></v-spacer>
    <div class="window-controls">
      <v-btn text tile small width="46" height="28" @click="minimize">
        <v-icon size="16">mdi-minus</v-icon>
      </v-btn>
      <v-btn v-if="maximized" text tile small width="46" height="28" @click="unmaximize">
        <v-icon size="18">mdi-window-restore</v-icon>
      </v-btn>
      <v-btn v-else text tile small width="46" height="28" @click="maximize">
        <v-icon size="14">mdi-square-outline</v-icon>
      </v-btn>
      <v-btn text tile small width="46" height="28" @click="close" 
        class="close-app-btn" color="#d70000"> 
        <v-icon size="18">mdi-window-close</v-icon>
      </v-btn>
    </div>
  </v-system-bar>
</template>


<script>
const remote = require('electron').remote
const win = remote.getCurrentWindow()
const { ipcRenderer } = require('electron')

export default {
  name: 'SystemBar',
  props: {
    disableRunApp: Boolean,
  },
  components: {
  },
  beforeCreate(){
    win.on('maximize', ()=>{
      this.maximized = true
    })
    win.on('unmaximize', ()=>{
      this.maximized = false
    })
  },
  mounted () {
    this.$nextTick(function () {
    })
  },
  destroyed () {
    win.removeAllListeners()
  },
  data: () => ({
    maximized: win.isMaximized(),
  }),
  computed: {
    headerColor() {
      if (this.$store.state.Settings.headerGradient) {
        if (this.$vuetify.theme.isDark) {
          return this.$store.state.Settings.headerGradientDark
        } else return this.$store.state.Settings.headerGradientLight
      } else {
        if (this.$vuetify.theme.isDark) {
          return this.$store.state.Settings.appColorDarkHeader
        } else return this.$store.state.Settings.appColorLightHeader
      }
    },
    ratingAndFavoriteInCard: {
      get() {
        return this.$store.state.Settings.ratingAndFavoriteInCard
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'ratingAndFavoriteInCard', value})
      },
    },
    videoPreview: {
      get() {
        return this.$store.state.Settings.videoPreviewEnabled
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'videoPreviewEnabled', value})
      },
    },
    playerType: {
      get() {
        return this.$store.state.Settings.playerType
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'playerType', value})
      },
    },
  },
  methods: {
    lock() {
      this.$emit('lock')
    },
    restart() {
      ipcRenderer.send('reload')
    },
    minimize() {
      win.minimize()
    },
    maximize() {
      this.maximized = !this.maximized
      win.maximize()
    },
    unmaximize() {
      this.maximized = !this.maximized
      win.unmaximize()
      // TODO: MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 unmaximize listeners added to [BrowserWindow]. Use emitter.setMaxListeners() to increase limit
    },
    close() {
      win.close()
    },
    toggleDarkMode() {
      let darkModeValue = !this.$store.state.Settings.darkMode
      this.$vuetify.theme.dark = darkModeValue
      this.$store.dispatch('updateSettingsState', {key:'darkMode', value:darkModeValue})
      ipcRenderer.send('toggleDarkMode', darkModeValue)
    },
    back() {
      this.$router.go(-1)
    },
    forward() {
      this.$router.go(1)
    },
    updateGutterSize(size) {
      this.$store.dispatch('updateSettingsState', {key: 'gapSize', value: size})
    },
  },
}
</script>

<style lang="less">
.app-menu-container {
  -webkit-app-region: no-drag;
  position: absolute;
  top: 0;
  left: 30px;
  height: 100%;
  .v-btn {
    text-transform: capitalize;
    font-weight: normal;
    letter-spacing: normal;
    padding: 0 8px !important;
    min-width: 0 !important;
    &__content {
      line-height: 1;
    }
  }
}
// .app-menu {
//   &.v-list {
//     .v-list-item {
//       min-height: 30px;
//     }
//     .v-list-item__icon {
//       margin: 0 8px 0 0 !important;
//       height: 30px;
//     }
//     .v-list-item__content {
//       padding: 0 !important;
//     }
//   }
//   .v-list-item__title {
//     font-size: 12px !important;
//     font-weight: normal !important;
//   }
// }
.app-system-bar-title {
  font-size: 12px;
}
.v-system-bar {
  overflow: hidden;
  height: 28px !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  &:before {
    content: '';
    position: absolute;
    height: 100%;
    top: 3px;
    left: 3px;
    right: 138px;
    background-color: transparent;
    -webkit-app-region: drag;
    pointer-events: none;
  }
  &.maximized:before {
    top: 0;
  }
}
.window-controls {
  -webkit-app-region: no-drag;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  .v-btn:not(.v-btn--round).v-size--small {
    min-width: 0;
  }
  .v-btn.close-app-btn:hover::before {
    opacity: 1;
  }
  .v-btn.close-app-btn:hover .v-icon {
    color: #fff;
  }
}
.v-system-bar--window .window-controls .v-icon {
  margin-right: 0;
}
@media (max-width: 840px)  {
  .app-system-bar-title {
    right: 160px;
    position: absolute;
  }
}
@media (max-width: 680px)  {
  .app-system-bar-title {
    display: none;
  }
}
</style>