<template>   
  <v-container fluid class="py-0">
    <v-row class="align-center">
      <div class="d-flex align-center">
        <v-icon size="20">mdi-video-outline</v-icon>
        <span class="caption ml-1 mr-3" v-text="$store.getters.videosTotal"/>
      </div>
      <div class="d-flex align-center">
        <v-icon size="20">mdi-account-outline</v-icon>
        <span class="caption ml-1 mr-3" v-text="$store.getters.performersTotal"/>
      </div>
      <div class="d-flex align-center">
        <v-icon size="16">mdi-tag-outline</v-icon>
        <span class="caption ml-1 mr-3" v-text="$store.getters.tagsTotal"/>
      </div>
      <div class="d-flex align-center">
        <v-icon size="16">mdi-web</v-icon>
        <span class="caption ml-1 mr-3" v-text="$store.getters.websitesTotal"/>
      </div>
      <div class="d-flex align-center">
        <v-icon size="16">mdi-harddisk</v-icon>
        <span class="caption ml-1" v-text="$store.getters.videosTotalSize"/>
      </div>
      
      <v-divider class="mx-4" vertical></v-divider>

      <!-- <v-spacer></v-spacer>

      <div class="console-log-in-status" 
        @click="$store.state.isLogVisible = !$store.state.isLogVisible">
        <v-icon left size="12">mdi-console</v-icon>
        <div class="log-text">{{lastLog}}</div>
        <div>{{logBtnText}}</div>
      </div> -->

      <v-spacer></v-spacer>
      
      <v-divider class="mx-4" vertical></v-divider>

      <v-menu
        v-model="notificationsMenu" top offset-y
        :close-on-content-click="false" nudge-top="5"
        min-width="400" max-width="400" fixed
      >
        <template v-slot:activator="{ on, attrs }">
          <v-badge overlap bordered dot color="grey" :value="isNotificationsEmpty">
            <v-btn x-small icon tile v-bind="attrs" v-on="on">
              <v-icon size="14" v-if="!notificationsMenu">mdi-bell-outline</v-icon>
              <v-icon size="14" v-else>mdi-bell</v-icon>
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
    </v-row>
  </v-container>
</template>

<script>
import vuescroll from 'vuescroll'

export default {
  name: 'StatusBar',
  components: {
    vuescroll
  },
  mounted() {
    this.$nextTick(function () {
      // this.consoleLog()
      this.$store.state.log = '>>> ' + this.getCurrentTime + 'app started \n'
    })
  },
  data: () => ({
    lastLog: 'app started',
    notificationsMenu: false,
  }),
  computed: {
    logBtnText() {
      let text = this.$store.state.isLogVisible ? 'hide' : 'show'
      return ` (click to ${text} details)`
    },
    // console: () => console,
    // window: () => window,
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
  },
  methods: {
    consoleLog(){
      // let old = console.log
      // let vm = this
      // console.log = function (message) {
      //   if (typeof message !== 'object') {
      //     vm.$store.state.log += vm.getCurrentTime() + message + '\n'
      //     vm.lastLog = message
      //   }
      //   old.apply(console, arguments)
      // }
      // console.log(this.console)
      // window.console = {
      //   log(message){
      //     if (typeof message !== 'object') {
      //       vm.$store.state.log += vm.getCurrentTime() + message + '\n'
      //       vm.lastLog = message
      //     }
      //   }
      // }
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
    // console(){
    //   console.log(this.console)
    // },
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
.notifications-list {
  max-height: 290px;
  .caption {
    word-break: break-all;
  }
}
</style>