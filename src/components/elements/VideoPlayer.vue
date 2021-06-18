<template>
  <div class="video-player-wrapper">
    <v-card class="video-player" :outlined="!maximized&&!fullscreen">
      <v-card-title v-if="showSystemBar" class="pa-0 title-bar" :class="{maximized:maximized,fullscreen:fullscreen,}">
        <v-spacer></v-spacer>
        <span class="now-playing-title">{{getFileNameFromPath(nowPlaying)}}</span>
        <v-spacer></v-spacer>
        <div class="window-controls">
          <v-btn text tile small width="46" height="32" @click="minimize">
            <v-icon size="16">mdi-minus</v-icon>
          </v-btn>
          <v-btn v-if="maximized" text tile small width="46" height="32" @click="unmaximize">
            <v-icon size="18">mdi-window-restore</v-icon>
          </v-btn>
          <v-btn v-else text tile small width="46" height="32" @click="maximize">
            <v-icon size="14">mdi-square-outline</v-icon>
          </v-btn>
          <v-btn text tile small width="46" height="32" @click="close" class="close-app-btn"> 
            <v-icon size="18">mdi-window-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>
      <div class="video-player-container">
        <VlcPlayer ref="player" @toggleFullscreen="toggleFullscreen" @nowPlaying="updateNowPlaying($event)"/>
      </div>
    </v-card>
  </div>
</template>


<script>
const _ = require("lodash")
const path = require("path")
const { ipcRenderer } = require('electron')
const remote = require('electron').remote
const win = remote.getCurrentWindow()

import VlcPlayer from '@/components/app/player/VlcPlayer'

export default {
  name: 'VideoPlayer',
  components: {
    VlcPlayer,
  },
  async beforeCreate() {
    // get databases from main window
    await this.$store.dispatch('getDb', 'videos')
    await this.$store.dispatch('getDb', 'tags')
    await this.$store.dispatch('getDb', 'performers')
    await this.$store.dispatch('getDb', 'playlists')
    await this.$store.dispatch('getDb', 'markers')
    await this.$store.dispatch('getDb', 'meta')
    await this.$store.dispatch('getDb', 'metaCards')
    await this.$store.dispatch('getDb', 'settings')
    // window events
    win.on('maximize', ()=>{ this.maximized = true })
    win.on('unmaximize', ()=>{ this.maximized = false })
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  beforeDestroy() {
    win.removeAllListeners()
  },
  data: () => ({
    maximized: win.isMaximized(),
    nowPlaying: '',
  }),
  computed: {
    showSystemBar() {return process.platform === 'win32'},
    videosDb() { return this.$store.state.videosDb},
    tagsDb() {return this.$store.state.tagsDb},
    playlistsDb() {return this.$store.state.playlistsDb},
    markersDb() {return this.$store.state.markersDb},
    metaDb() {return this.$store.state.metaDb},
    metaCardsDb() {return this.$store.state.metaCardsDb},
    settingsDb() {return this.$store.state.settingsDb},
    fullscreen() {return this.$store.state.fullscreen},
  },
  methods: {
    getFileNameFromPath(videoPath) {return path.parse(videoPath).name},
    updateNowPlaying(video) { if (video) this.nowPlaying = video.path},
    minimize() { win.minimize() },
    maximize() {
      this.maximized = !this.maximized
      win.maximize()
    },
    unmaximize() {
      this.maximized = !this.maximized
      win.unmaximize()
    },
    close() {
      this.playlist = []
      this.$refs.player.stop()
      ipcRenderer.send('closePlayer')
    },
    toggleFullscreen() { this.$emit("toggleFullscreen") },
  },
}
</script>


<style lang="less">
.video-player {
  border-radius: 0 !important;
  overflow: hidden !important;
  height: 100%;
  &-wrapper {
    height: 100%;
  }
  &-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .title-bar {
    padding: 0;
    position: relative;
    z-index: 5;
    min-height: 32px;
    &:before {
      content: '';
      position: absolute;
      height: 100%;
      top: 3px;
      left: 15px;
      right: 80px;
      background-color: transparent;
      -webkit-app-region: drag;
      pointer-events: none;
    }
    &.maximized:before {
      top: 0;
    }
    &.fullscreen {
      display: none;
    }
    .v-btn, .v-rating, .v-icon {
      -webkit-app-region: no-drag !important;
    }
  }
  .now-playing-title {
    font-size: 12px;
    overflow: hidden;
    max-width: calc(100vw - 350px);
    white-space: nowrap;
  }
}
.add-playlist {
  .v-list-item {
    display: flex;
    justify-content: space-between;
    &:after {
      display: none;
    }
  }
}
// .video-js {
//   font-size: 11px;
//   padding-top: calc(100vh - 36px) !important;
//   .vjs-control-text {
//     height: 0;
//   }
// }
// .vjs-prev {
//   width: 40px;
//   cursor: pointer;
//   &:before {
//     content: "\F04AE";
//     font-family: "Material Design Icons";
//     font-size: 2em;
//     height: 100%;
//     display: flex;
//     justify-content: center;
//     align-items: center;
//   }
// }
// .vjs-next {
//   width: 40px;
//   cursor: pointer;
//   &:before {
//     content: "\F04AD";
//     font-family: "Material Design Icons";
//     font-size: 2em;
//     height: 100%;
//     display: flex;
//     justify-content: center;
//     align-items: center;
//   }
// }
// .vjs-tip {
//   font-size: 12px;
//   bottom: 18px;
// }
// .vjs-marker {
//   &:before {
//     font-family: "Material Design Icons";
//     position: absolute;
//     left: -200%;
//     top: -120%;
//   }
//   &.marker {
//     &-tag:before {
//       content: "\F04F9";
//     }
//     &-favorite:before {
//       content: "\F02D1";
//       color: #e91e63;
//     }
//     &-bookmark:before {
//       content: "\F00C0";
//       color: #f13939;
//     }
//   }
//   &.color {
//     &-cc0e00 {color:#cc0e00;}
//     &-e8004f {color:#e8004f;}
//     &-ae0eff {color:#ae0eff;}
//     &-2041f7 {color:#2041f7;}
//     &-2196f3 {color:#2196f3;}
//     &-00bcd4 {color:#00bcd4;}
//     &-009688 {color:#009688;}
//     &-2ac530 {color:#2ac530;}
//     &-8bc34a {color:#8bc34a;}
//     &-ff9800 {color:#ff9800;}
//     &-ff5722 {color:#ff5722;}
//     &-795548 {color:#795548;}
//     &-9b9b9b {color:#9b9b9b;}
//   }
// }
.window-controls {
  -webkit-app-region: no-drag;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  .v-btn:not(.v-btn--round).v-size--small {
    min-width: 0;
  }
  .v-btn.close-app-btn:before {
    color: rgb(215, 0, 0);
  }
  .v-btn.close-app-btn:hover::before {
    opacity: 1;
  }
  .v-btn.close-app-btn:hover .v-icon {
    color: #fff;
  }
}
</style>
<style lang="less" scoped>
// .performers-starring-grid {
//   display: grid;
//   grid-gap: 15px;
//   grid-template-columns: repeat(auto-fill, minmax(164px, 1fr));
// }
// .performer-card {
//   &:hover {
//     .performer-ratings {
//       opacity: 1;
//     }
//   }
// }
// .performer-ratings {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   width: 100%;
//   background-color: rgba(0, 0, 0, 0.5);
//   padding: 0 5px 3px;
//   opacity: 0;
//   transition: .3s all ease;
// }
// .video-details {
//   display: flex;
//   justify-content: space-between;
//   .rating-favorite {
//     display: flex;
//     flex-wrap: nowrap;
//     align-items: flex-start;
//     padding: 10px;
//   }
// }
// .marker-name {
//   margin-left: 5px;
//   &-hide {
//     display: none;
//   }
// }
</style>

