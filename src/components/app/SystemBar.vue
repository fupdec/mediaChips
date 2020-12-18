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
          <v-list-item link @click="restart">
            <v-list-item-title>
              <v-icon left size="18">mdi-restart</v-icon> Restart
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="close">
            <v-list-item-title>
              <v-icon left size="18">mdi-exit-to-app</v-icon> Exit
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
          <v-list-item link @click="toggleDarkMode">
            <v-list-item-title>
              <v-icon left size="18">mdi-theme-light-dark</v-icon> Toggle Dark Mode
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn @click="back" text tile small width="46" height="28" class="ml-6">
        <v-icon size="18" class="ma-0">mdi-arrow-left</v-icon>
      </v-btn>
      <v-btn @click="forward" text tile small width="46" height="28">
        <v-icon size="18" class="ma-0">mdi-arrow-right</v-icon>
      </v-btn>
    </div>
    <v-spacer></v-spacer>
    <span class="app-system-bar-title">{{$route.name + ' - '}}Adult Video Database 0.5.3</span>
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
    gradient() {
      
    },
  },
  methods: {
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
      let darkModeValue = !this.$store.getters.darkMode
      this.$vuetify.theme.dark = darkModeValue
      this.$store.dispatch('toggleDarkMode', darkModeValue)
    },
    back() {
      this.$router.go(-1)
    },
    forward() {
      this.$router.go(1)
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
</style>