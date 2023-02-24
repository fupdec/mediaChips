<template>   
  <v-system-bar window app :class="{maximized:maximized}" :style="{background: headerColor}">
    <img :src="logoPath" alt="MediaChips" width="16" height="16">
    <div class="app-menu-container">
      <v-menu bottom offset-y min-width="160">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" :ripple="false" small tile text height="28">
            App
          </v-btn>
        </template>
        <v-list dense class="context-menu">
          <v-list-item link @mouseup="checkForUpdates">
            <v-list-item-title>
              <v-icon left size="18">mdi-update</v-icon> Check for Updates...
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @mouseup="$store.state.Settings.dialogScanVideos=true">
            <v-list-item-title>
              <v-icon left size="18">mdi-video-plus</v-icon> Add New Videos...
            </v-list-item-title>
          </v-list-item>
          <v-divider class="ma-1"></v-divider>
          <v-list-item link @mouseup="isPlayVideoInSystemPlayer=!isPlayVideoInSystemPlayer">
            <v-list-item-title>
              <v-icon left size="18">mdi-television-play</v-icon> Play Video in System Player
            </v-list-item-title>
            <v-icon size="20" class="ml-6" :color="isPlayVideoInSystemPlayer?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
          </v-list-item>
          <v-divider class="ma-1"></v-divider>
          <v-list-item link @mouseup="lock" :disabled="!$store.state.Settings.passwordProtection">
            <v-list-item-title>
              <v-icon left size="18">mdi-lock</v-icon> Lock
              <span></span>
            </v-list-item-title>
          </v-list-item>
          <v-divider class="ma-1"></v-divider>
          <v-list-item link @mouseup="close">
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
          <v-list-item class="pr-2" link @mouseup="toggleDarkMode">
            <v-list-item-title>
              <v-icon left size="18">mdi-theme-light-dark</v-icon>
              <div class="shortcut"><span>Toggle Dark Mode</span></div>
            </v-list-item-title>
          </v-list-item>
          <v-divider class="ma-1"></v-divider>
          <v-menu open-on-hover offset-x nudge-top="3" min-width="150">
            <template v-slot:activator="{ on, attrs }">
              <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
                <v-list-item-title> 
                  <v-icon left size="18">mdi-format-list-bulleted</v-icon> Navigation Bar
                </v-list-item-title>
                <v-icon size="22">mdi-menu-right</v-icon>
              </v-list-item>
            </template>
            
            <v-list dense class="context-menu">
              <v-list-item @mouseup="navigationSide = '1'" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-border-left-variant</v-icon> Side
                </v-list-item-title>
                <v-icon size="20" class="ml-6 mr-2" :color="navigationSide=='1'?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
              </v-list-item>
              <v-list-item @mouseup="navigationSide = '2'" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-border-bottom-variant</v-icon> Bottom
                </v-list-item-title>
                <v-icon size="20" class="ml-6 mr-2" :color="navigationSide=='2'?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-menu open-on-hover offset-x nudge-top="3" min-width="150" >
            <template v-slot:activator="{ on, attrs }">
              <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
                <v-list-item-title> 
                  <v-icon left size="18">mdi-magnify</v-icon> Zoom
                </v-list-item-title>
                <v-icon size="22">mdi-menu-right</v-icon>
              </v-list-item>
            </template>
            
            <v-list dense class="context-menu">
              <v-list-item class="pr-1" link>
                <v-slider v-model="zoom" min="0.5" step="0.1" max="2" hide-details />
              </v-list-item>
              <v-list-item @mouseup="zoom=1" class="pr-5" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-restore</v-icon> Reset to Default Zoom
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-divider class="ma-1"></v-divider>
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
              <v-list-item @mouseup="gapSize = 'xs'" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-size-xs</v-icon> Extra Small
                </v-list-item-title>
                <v-icon size="20" class="ml-6 mr-2" :color="gapSize=='xs'?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
              </v-list-item>
              <v-list-item @mouseup="gapSize = 's'" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-size-s</v-icon> Small
                </v-list-item-title>
                <v-icon size="20" class="ml-6 mr-2" :color="gapSize=='s'?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
              </v-list-item>
              <v-list-item @mouseup="gapSize = 'm'" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-size-m</v-icon> Medium
                </v-list-item-title>
                <v-icon size="20" class="ml-6 mr-2" :color="gapSize=='m'?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
              </v-list-item>
              <v-list-item @mouseup="gapSize = 'l'" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-size-l</v-icon> Large
                </v-list-item-title>
                <v-icon size="20" class="ml-6 mr-2" :color="gapSize=='l'?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
              </v-list-item>
              <v-list-item @mouseup="gapSize = 'xl'" class="pr-1" link>
                <v-list-item-title>
                  <v-icon left size="18">mdi-size-xl</v-icon> Extra Large
                </v-list-item-title>
                <v-icon size="20" class="ml-6 mr-2" :color="gapSize=='xl'?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-list-item class="pr-1" link @mouseup="ratingAndFavoriteInCard=!ratingAndFavoriteInCard">
            <v-list-item-title>
              <v-icon left size="18">mdi-star</v-icon> Rating and Favorite in Description
            </v-list-item-title>
            <v-icon size="20" class="ml-6" :color="ratingAndFavoriteInCard?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu bottom offset-y min-width="160">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" :ripple="false" small tile text height="28">
            Help
          </v-btn>
        </template>
        <v-list dense class="context-menu">
          <v-list-item link @mouseup="openLink('https://mediachips.app/docs')">
            <v-list-item-title>
              <v-icon left size="18">mdi-book-open-page-variant-outline</v-icon> Documentation
            </v-list-item-title>
          </v-list-item>
          <v-divider class="ma-1"></v-divider>
          <v-list-item link @mouseup="toggleDevTools">
            <v-list-item-title>
              <v-icon left size="18">mdi-tools</v-icon> Toggle Developer Tools
              <span class="pl-8">Ctrl+Shift+I</span>
            </v-list-item-title>
          </v-list-item>
          <v-divider class="ma-1"></v-divider>
          <v-list-item link @mouseup="about">
            <v-list-item-title>
              <v-icon left size="18">mdi-information-variant</v-icon> About
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn v-if="!disableRunApp" @mouseup="back" text tile small width="46" height="28" class="ml-6" title="Back (Ctrl+Shift+←)">
        <v-icon size="18" class="ma-0">mdi-arrow-left</v-icon>
      </v-btn>
      <v-btn v-if="!disableRunApp" @mouseup="forward" text tile small width="46" height="28" title="Forward (Ctrl+Shift+→)">
        <v-icon size="18" class="ma-0">mdi-arrow-right</v-icon>
      </v-btn>
    </div>
    <v-spacer></v-spacer>
    <span class="app-system-bar-title">{{$route.name + ' - '}}MediaChips</span>
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
const { ipcRenderer, webFrame } = require('electron')
const path = require('path')
const shell = require('electron').shell

export default {
  name: 'SystemBar',
  props: {
    disableRunApp: Boolean,
  },
  mounted () {
    this.$nextTick(function () {
      // requests from main process for system menu
      ipcRenderer.on('maximize', () => { this.maximized = true })
      ipcRenderer.on('unmaximize', () => { this.maximized = false })
      ipcRenderer.on('addNewVideos', () => { this.$store.state.Settings.dialogScanVideos=true })
      ipcRenderer.on('checkForUpdates', () => { this.checkForUpdates() })
      ipcRenderer.on('lockApp', () => { this.lock() })
      ipcRenderer.on('toggleSystemPlayer', () => { this.isPlayVideoInSystemPlayer=!this.isPlayVideoInSystemPlayer })
      ipcRenderer.on('toggleDarkMode', () => { this.toggleDarkMode() })
      ipcRenderer.on('aboutApp', () => { this.about() })
      ipcRenderer.on('navigationBack', () => { this.back() })
      ipcRenderer.on('navigationForward', () => { this.forward() })
      ipcRenderer.on('updateSettingsState', (e, stateName, value) => { 
        if (stateName == 'zoom') {
          if (value == '+') this.zoom += 0.1
          else if (value == '-') this.zoom -= 0.1
          else this.zoom = 1
        } else this[stateName] = value 
      })
      ipcRenderer.send('changeMenuItem', 'systemPlayer', this.isPlayVideoInSystemPlayer )
      ipcRenderer.send('changeMenuItem', 'lock', this.$store.state.Settings.passwordProtection )
    })
  },
  data: () => ({
    maximized: false,
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
      get() {return this.$store.state.Settings.ratingAndFavoriteInCard},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'ratingAndFavoriteInCard', value})},
    },
    isPlayVideoInSystemPlayer: {
      get() {return this.$store.state.Settings.isPlayVideoInSystemPlayer},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'isPlayVideoInSystemPlayer', value})},
    },
    navigationSide: {
      get() {return this.$store.state.Settings.navigationSide},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'navigationSide', value})},
    },
    gapSize: {
      get() {return this.$store.state.Settings.gapSize},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'gapSize', value})},
    },
    zoom: {
      get() {
        let val = this.$store.state.Settings.zoom
        webFrame.setZoomFactor(val)
        return val
      },
      set(value) {this.$store.dispatch('updateSettingsState', {key:'zoom', value})},
    },
    logoPath() {return path.join('file://', __static, '/icons/icon.png')},
  },
  methods: {
    checkForUpdates() {this.$emit('checkForUpdates')},
    lock() {this.$emit('lock')},
    about() {this.$emit('about')},
    toggleDevTools() { ipcRenderer.send('toggleDevTools')},
    minimize() { ipcRenderer.invoke('minimize') },
    maximize() {
      this.maximized = true
      ipcRenderer.invoke('maximize')
    },
    unmaximize() {
      this.maximized = false
      ipcRenderer.invoke('unmaximize')
    },
    close() { ipcRenderer.send('closeApp') },
    toggleDarkMode() {
      let darkModeValue = !this.$store.state.Settings.darkMode
      this.$vuetify.theme.dark = darkModeValue
      this.$store.dispatch('updateSettingsState', {key:'darkMode', value:darkModeValue})
      ipcRenderer.send('toggleDarkMode', darkModeValue)
    },
    back() {this.$router.go(-1)},
    forward() {this.$router.go(1)},
    openLink(link) { shell.openExternal(link) },
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