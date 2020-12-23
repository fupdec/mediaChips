<template>
  <v-navigation-drawer v-if="navigationSide=='1'" 
    app permanent mini-variant expand-on-hover clipped
  >
    <vuescroll :ops="ops">
      <v-list nav dense>
        <v-list-item link to="/home" color="secondary"> 
          <v-list-item-icon>
            <v-icon>mdi-home-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Home</v-list-item-title>
        </v-list-item>
        
        <v-list-item link to="/videos/:default?tabId=default" color="secondary">
          <v-list-item-icon>
            <v-icon>mdi-video-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Videos</v-list-item-title>
        </v-list-item>
        
        <v-list-item v-if="isShowVideoBtn" link :to="$router.currentRoute" color="secondary">
          <v-list-item-icon>
            <v-icon>mdi-television-play</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Video details</v-list-item-title>
        </v-list-item>
        
        <v-list-item link to="/performers/:default?tabId=default" color="secondary">
          <v-list-item-icon>
            <v-icon>mdi-account-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Performers</v-list-item-title>
        </v-list-item>
        
        <v-list-item v-if="isShowPerformerBtn" link :to="$router.currentRoute" color="secondary">
          <v-list-item-icon>
            <v-icon>mdi-card-account-details-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Performer details</v-list-item-title>
        </v-list-item>
        
        <v-list-item link to="/tags/:default?tabId=default" color="secondary">
          <v-list-item-icon>
            <v-icon>mdi-tag-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Tags</v-list-item-title>
        </v-list-item>
        
        <v-list-item v-if="isShowTagBtn" link :to="$router.currentRoute" color="secondary">
          <v-list-item-icon>
            <v-icon>mdi-tag-text-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Tag details</v-list-item-title>
        </v-list-item>
        
        <v-list-item link to="/websites/:default?tabId=default" color="secondary">
          <v-list-item-icon>
            <v-icon>mdi-web</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Websites</v-list-item-title>
        </v-list-item>
        
        <v-list-item v-if="isShowWebsiteBtn" link :to="$router.currentRoute" color="secondary">
          <v-list-item-icon>
            <v-icon>mdi-web-box</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Website details</v-list-item-title>
        </v-list-item>
        
        <v-list-item link to="/settings" color="secondary">
          <v-list-item-icon> 
            <v-icon>mdi-cog-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Settings</v-list-item-title>
        </v-list-item>
      </v-list>
    </vuescroll>
  </v-navigation-drawer>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'SideBar',
  components: {
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    isShowVideoBtn: false,
    isShowPerformerBtn: false,
    isShowWebsiteBtn: false,
    isShowTagBtn: false,
    ops: {
      scrollPanel: {
        scrollingX: false
      },
      rail: {
        size: '4px',
      }
    }
  }),
  computed: {
    navigationSide() {
      return this.$store.getters.navigationSide
    },
  },
  methods: {
  },
  watch: {
    $route() {
      this.isShowVideoBtn = this.$router.currentRoute.path.includes('/video/')
      this.isShowPerformerBtn = this.$router.currentRoute.path.includes('/performer/')
      this.isShowWebsiteBtn = this.$router.currentRoute.path.includes('/website/')
      this.isShowTagBtn = this.$router.currentRoute.path.includes('/tag/')
    },
  },
}
</script>