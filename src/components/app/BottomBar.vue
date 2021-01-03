<template>
  <v-bottom-navigation v-if="navigationSide=='2'" absolute style="bottom:20px" shift>
    <v-btn to="/home" text color="secondary">
      <span>Home</span>
      <v-icon>mdi-home-outline</v-icon>
    </v-btn>

    <v-btn to="/videos/:default?tabId=default" text color="secondary">
      <span>Videos</span>
      <v-icon>mdi-video-outline</v-icon>
    </v-btn>

    <v-btn v-if="isShowVideoBtn" :to="$router.currentRoute" text color="secondary">
      <span>Video</span>
      <v-icon>mdi-television-play</v-icon>
    </v-btn>

    <v-btn to="/performers/:default?tabId=default" text color="secondary">
      <span>Performers</span>
      <v-icon>mdi-account-outline</v-icon>
    </v-btn>

    <v-btn v-if="isShowPerformerBtn" :to="$router.currentRoute" text color="secondary">
      <span>Performer</span>
      <v-icon>mdi-card-account-details-outline</v-icon>
    </v-btn>

    <v-btn to="/tags/:default?tabId=default" text color="secondary">
      <span>Tags</span>
      <v-icon>mdi-tag-outline</v-icon>
    </v-btn>

    <v-btn v-if="isShowTagBtn" :to="$router.currentRoute" text color="secondary">
      <span>Tag</span>
      <v-icon>mdi-tag-text-outline</v-icon>
    </v-btn>

    <v-btn to="/websites/:default?tabId=default" text color="secondary">
      <span>Websites</span>
      <v-icon>mdi-web</v-icon>
    </v-btn>

    <v-btn v-if="isShowWebsiteBtn" :to="$router.currentRoute" text color="secondary">
      <span>Website</span>
      <v-icon>mdi-web-box</v-icon>
    </v-btn>

    <v-btn to="/settings" text color="secondary">
      <span>Settings</span>
      <v-icon>mdi-cog-outline</v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>


<script>
export default {
  name: 'BottomBar',
  data: () => ({
    navigationMenu: 1,
    isShowVideoBtn: false,
    isShowPerformerBtn: false,
    isShowWebsiteBtn: false,
    isShowTagBtn: false,
  }),
  computed: {
    navigationSide() {
      return this.$store.getters.navigationSide
    },
  },
  methods: {
  },
  watch: {
    $route(newValue, oldValue) {
      this.isShowVideoBtn = this.$router.currentRoute.path.includes('/video/')
      this.isShowPerformerBtn = this.$router.currentRoute.path.includes('/performer/')
      this.isShowWebsiteBtn = this.$router.currentRoute.path.includes('/website/')
      this.isShowTagBtn = this.$router.currentRoute.path.includes('/tag/')
    },
  },
}
</script>


<style lang="less" scoped>
.v-btn {
  -webkit-user-drag: none !important;
}
</style>