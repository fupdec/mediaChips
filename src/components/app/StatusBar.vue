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

    <v-tooltip v-if="backgroundProcesses.length" top>
      <template v-slot:activator="{ on }">
        <div v-on="on" class="d-flex align-center worker pr-2 pb-1">
          <v-divider vertical></v-divider>
          <span class="pl-2"></span>
          <v-icon size="20" class="loading-animation">mdi-loading</v-icon>
          <span class="caption val" v-text="backgroundProcesses.length"/>
        </div>
      </template>
      <div> <div class="overline">Background processes</div>
        <div v-for="(bp) in backgroundProcesses" :key="bp.id">
          <v-icon dark small>mdi-{{bp.icon}}</v-icon> {{bp.text}}
        </div>
      </div>
    </v-tooltip>

    <v-divider vertical></v-divider>

    <v-tooltip v-if="!reg" top>
      <template v-slot:activator="{ on }">
        <v-btn v-on="on" @click="openRegistration" height="20" small color="error"> Not registered </v-btn>
      </template>
      <span>Register the application and get all the features</span>
    </v-tooltip>

    <v-divider vertical></v-divider>

    <v-tooltip top>
      <template v-slot:activator="{ on }">
        <span v-on="on" class="px-4 d-flex"><v-icon size="18" class="mb-1">mdi-database-outline</v-icon></span>
      </template>
      <div>
        <div class="overline text-center">Database</div>
        <div class="d-flex align-center">
          <v-icon size="20" left dark>mdi-cogs</v-icon> Version: 
          <span class="ml-1" v-text="$store.state.Settings.databaseVersion"/>
        </div>
      </div>
      <div class="mt-2">
        <div class="overline text-center">Total videos</div>
        <div class="d-flex align-center">
          <v-icon size="20" left dark>mdi-video</v-icon> Number: 
          <span class="ml-1" v-text="$store.getters.videosTotal"/>
        </div>
        <div class="d-flex align-center">
          <v-icon size="20" left dark>mdi-harddisk</v-icon> Size:
          <span class="ml-1" v-text="$store.getters.videosTotalSize"/>
        </div>
      </div>
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
const shell = require('electron').shell

import Functions from '@/mixins/Functions'
import vuescroll from 'vuescroll'
import Keys from '@/mixins/Keys'

export default {
  name: 'StatusBar',
  components: { vuescroll },
  mixins: [Functions, Keys], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    notificationsMenu: false,
    penultLog: {},
  }),
  computed: {
    log() { return this.$store.state.log },
    logsNumber() { return this.$store.state.log.length },
    lastLog() {
      let numberOfLogs = this.$store.state.log.length
      return this.$store.state.log[numberOfLogs-1]
    },
    getCurrentTime() { return new Date().toLocaleTimeString() + ' ' },
    notifications() { return this.$store.getters.getNotifications },
    notificationsHeader() {
      if (this.$store.getters.getNotifications.length) return 'Notifications'
      else return 'No new notifications'
    },
    isNotificationsEmpty() {
      if (this.$store.getters.getNotifications.length) return true
      else return false
    },
    getNumberSelectedItems() {
      let number = 0
      if (this.isVideosPage) number = this.$store.getters.getSelectedVideos.length
      else if (this.$route.path.includes('/meta/')) number = this.$store.state.Meta.selectedMeta.length
      return number
    },
    getTypeSelectedItems() {
      let type = ''
      if (this.isVideosPage) type = 'video'
      else if (this.$route.path.includes('/meta/')) {
        type = this.$store.getters.meta.find({id: this.$route.query.metaId}).value().settings.nameSingular.toLowerCase()
      } 
      return type
    },
    getSelectedVideosSize() {
      let ids = this.$store.getters.getSelectedVideos
      let selectedVideos = this.$store.getters.videos.filter(v=>(ids.includes(v.id))).value()
      return this.getVideosTotalSize(selectedVideos)
    },
    getTotalVideosSize() { return this.getVideosTotalSize(this.$store.state.Videos.filteredVideos) },
    getTotalVideosNumber() { return this.$store.state.Videos.filteredVideos.length },
    isVideosPage() {
      const pages = ['/videos/:','/metacard/']
      return pages.some(page => this.$route.path.includes(page))
    },
    backgroundProcesses() { return this.$store.state.backgroundProcesses },
  },
  methods: {
    msToTime(ms) {
      let date = new Date(ms)
      return date.toLocaleDateString() + ', ' + date.toLocaleTimeString()
    },
    close(id) { this.$store.dispatch('removeNotification', id) },
    clearAllNotifications(){
      this.$store.dispatch('clearAllNotifications')
      this.notificationsMenu = false
    },
    openRegistration() { this.$router.push('/settings/?tab=about') }
  },
  watch: {
    lastLog(log) {
      setTimeout(() => { this.penultLog = log }, 1000)
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