<template>   
  <div class="d-flex" style="width:100%">
    <div v-if="isVideosPage" class="d-flex align-center ml-4">
      <span class="caption">
        {{getTotalVideosNumber}} video{{getTotalVideosNumber>1?'s':''}}
        {{getTotalVideosSize}}
      </span>
    </div>
    
    <v-divider v-if="isVideosPage" class="ml-4" vertical></v-divider>
    
    <div class="d-flex align-center ml-4" v-if="getNumberSelectedItems>0">
      <span class="caption">
        {{getNumberSelectedItems}} 
        {{getTypeSelectedItems}}{{getNumberSelectedItems>1?'s':''}} selected
      </span>
      <span v-if="isVideosPage" class="caption ml-2">{{getSelectedVideosSize}}</span>
    </div>
    
    <v-divider v-if="getNumberSelectedItems>0" class="ml-4" vertical></v-divider>

    <div @click="$store.state.isLogVisible = !$store.state.isLogVisible" class="last-log">
      <v-icon left size="18">mdi-notebook-outline</v-icon>
      <transition mode="out-in">
        <div v-if="logsNumber>0" :key="logsNumber" class="logs">
          <div class="log">
            <span class="text-wrapper"> 
              <span class="type" :class="[penultLog.type]">{{penultLog.type}}</span>
              <span class="text" :class="[penultLog.color+'--text']" v-html="penultLog.text"/>
            </span>
            <span class="time text--secondary">{{msToTime(penultLog.time)}}</span>
          </div>
          <div class="log">
            <span class="text-wrapper"> 
              <span class="type" :class="[lastLog.type]">{{lastLog.type}}</span>
              <span class="text" :class="[lastLog.color+'--text']" v-html="lastLog.text"/>
            </span>
            <span class="time text--secondary">{{msToTime(lastLog.time)}}</span>
          </div>
        </div>
      </transition>
    </div>

    <v-tooltip v-if="$store.state.backgroundProcesses" top>
      <template v-slot:activator="{ on }">
        <div v-on="on" class="d-flex align-center worker pr-2 pb-1">
          <v-divider vertical></v-divider>
          <span class="pl-2"></span>
          <v-icon size="20" class="loading-animation">mdi-loading</v-icon>
          <span class="caption val" v-text="$store.state.backgroundProcesses"/>
        </div>
      </template>
      <span>Number of background processes</span>
    </v-tooltip>

    <v-divider vertical></v-divider>

    <v-tooltip top>
      <template v-slot:activator="{ on }">
        <span v-on="on" class="px-4 d-flex"><v-icon size="18" class="mb-1">mdi-database-outline</v-icon></span>
      </template>
      <span>
        <div class="overline text-center">Total</div>
        <div class="d-flex align-center">
          <v-icon size="20" dark>mdi-video</v-icon>
          <span class="ml-1" v-text="$store.getters.videosTotal"/>
        </div>
        <div class="d-flex align-center">
          <v-icon size="20" dark>mdi-account</v-icon>
          <span class="ml-1" v-text="$store.getters.performersTotal"/>
        </div>
        <div class="d-flex align-center">
          <v-icon size="16" dark>mdi-tag</v-icon>
          <span class="ml-1" v-text="$store.getters.tagsTotal"/>
        </div>
        <div class="d-flex align-center">
          <v-icon size="18" dark>mdi-web</v-icon>
          <span class="ml-1" v-text="$store.getters.websitesTotal"/>
        </div>
        <div class="d-flex align-center">
          <v-icon size="20" dark>mdi-harddisk</v-icon>
          <span class="ml-1" v-text="$store.getters.videosTotalSize"/>
          <!-- TODO fix wrong file size -->
        </div>
      </span>
    </v-tooltip>
    
    <v-divider vertical></v-divider>

    <v-menu
      v-model="notificationsMenu" top offset-y 
      :close-on-content-click="false" nudge-top="5"
      min-width="400" max-width="400" fixed z-index="1000"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-badge :value="isNotificationsEmpty"
          class="notifications-badge" overlap bordered dot color="grey" offset-x="24" offset-y="10">
          <v-btn x-small icon tile v-bind="attrs" width="48" v-on="on">
            <v-icon size="16" v-if="!notificationsMenu">mdi-bell-outline</v-icon>
            <v-icon size="16" v-else>mdi-bell</v-icon>
          </v-btn>
        </v-badge>
      </template>

      <v-card>
        <v-card-actions>
          <div class="caption text-uppercase">{{notificationsHeader}}</div>
          <v-spacer></v-spacer>
          <v-btn icon x-small @click="clearAllNotifications ">
            <v-icon>mdi-notification-clear-all</v-icon>
          </v-btn>
          <v-btn icon x-small @click="notificationsMenu = false">
            <v-icon>mdi-chevron-down</v-icon>
          </v-btn>
        </v-card-actions>
        
        <vuescroll>
          <v-card-text class="pa-0 notifications-list">
            <v-alert 
              v-for="alert in notifications" :key="alert.id"
              dense text :type="alert.type" class="mb-1"
            >
              <v-row align="center">
                <v-col class="grow pa-0">
                  <div class="caption">{{alert.text}}</div>
                </v-col>
                <v-col class="shrink pa-0">
                  <v-btn depressed block icon :color="alert.type"
                    @click="close(alert.id)" width="24" height="24"
                  ><v-icon size="16">mdi-close</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-alert>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-menu>

    <v-snackbar
      v-for="snackbar in notifications" :key="snackbar.id" 
      v-model="snackbar.showing" :timeout="6000"
      bottom right :color="snackbar.type"
    >{{snackbar.text}}
    </v-snackbar>
  </div>
</template>

<script>
import Functions from '@/mixins/Functions'
import vuescroll from 'vuescroll'

export default {
  name: 'StatusBar',
  components: {
    vuescroll
  },
  mixins: [Functions], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    notificationsMenu: false,
    penultLog: {},
  }),
  computed: {
    log() {
      return this.$store.state.log
    },
    logsNumber() {
      return this.$store.state.log.length
    },
    lastLog() {
      let numberOfLogs = this.$store.state.log.length
      return this.$store.state.log[numberOfLogs-1]
    },
    getCurrentTime() {
      return new Date().toLocaleTimeString() + ' '
    },
    notifications() {
      return this.$store.getters.getNotifications
    },
    notificationsHeader() {
      if (this.$store.getters.getNotifications.length) {
        return 'Notifications'
      } else { return 'No new notifications' }
    },
    isNotificationsEmpty() {
      if (this.$store.getters.getNotifications.length) {
        return true
      } else { return false }
    },
    getNumberSelectedItems() {
      let number = 0
      if (this.isVideosPage) {
        number = this.$store.getters.getSelectedVideos.length
      }
      if (this.$route.path.includes('/performers/:')) {
        number = this.$store.getters.getSelectedPerformers.length
      }
      if (this.$route.path.includes('/tags/:')) {
        number = this.$store.getters.getSelectedTags.length
      }
      if (this.$route.path.includes('/websites/:')) {
        number = this.$store.getters.getSelectedWebsites.length
      }
      return number
    },
    getTypeSelectedItems() {
      let type = ''
      if (this.isVideosPage) type = 'video'
      if (this.$route.path.includes('/performers/:')) type = 'performer'
      if (this.$route.path.includes('/tags/:')) type = 'tag'
      if (this.$route.path.includes('/websites/:')) type = 'website'
      return type
    },
    getSelectedVideosSize() {
      let ids = this.$store.getters.getSelectedVideos
      let selectedVideos = this.$store.getters.videos.filter(v=>(ids.includes(v.id))).value()
      return this.getVideosTotalSize(selectedVideos)
    },
    getTotalVideosSize() {
      let videos = this.$store.getters.filteredVideos.value()
      return this.getVideosTotalSize(videos)
    },
    getTotalVideosNumber() {
      return this.$store.getters.filteredVideos.value().length
    },
    isVideosPage() {
      const pages = ['/videos/:','/performer/:','/website/:']
      return pages.some(page => this.$route.path.includes(page))
    },
  },
  methods: {
    msToTime(ms) {
      let date = new Date(ms)
      return date.toLocaleDateString() + ', ' + date.toLocaleTimeString()
    },
    close(id){
      this.$store.dispatch('removeNotification', id)
    },
    clearAllNotifications(){
      this.$store.dispatch('clearAllNotifications')
      this.notificationsMenu = false
    },
  },
  watch: {
    $route(newRoute) {
      this.$store.commit('updateSelectedVideos', [])
      this.$store.commit('updateSelectedPerformers', [])
      this.$store.commit('updateSelectedTags', [])
      this.$store.commit('updateSelectedWebsites', [])
    },
    lastLog(log) {
      setTimeout(() => {
        this.penultLog = log
      }, 1000)
    },
  },
}
</script>

<style lang="less" scoped>
.v-btn:before {
  opacity: 0 !important;
}
.v-ripple__container {
  opacity: 0 !important;
}
.v-menu__content--fixed {
  position: fixed;
  top: auto !important;
  bottom: 30px !important;
}
</style>

<style lang="less">
.notifications-list {
  max-height: 290px;
  .caption {
    word-break: break-all;
  }
}
.notifications-badge {
  .v-badge__badge {
    pointer-events: none;
  }
}
.worker {
  position: relative;
  .val {
    position: absolute;
    left: 0;
    right: 0;
    margin: auto;
    text-align: center;
  }
}
</style>