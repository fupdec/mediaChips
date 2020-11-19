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

<style lang="less">
// .app-sidebar {
//   z-index: 501;
//   .v-navigation-drawer__content {
//     display: flex;
//   }
//   .current {
//     &:after {
//       content: '';
//       position: absolute;
//       left: 0;
//       height: 100%;
//       width: 4px;
//       background-color: var(--v-primary-base);
//       opacity: 0.5;
//     }
//   }
//   .v-slider--horizontal {
//     min-height: 16px;
//   }
// }
// .app-main-nav {
//   width: 44px;
//   height: 100%;
//   display: flex;
//   flex-direction: column;
//   .__view {
//     height: 100%;
//   }
//   &-btns {
//     display: flex;
//     flex-direction: column;
//     justify-content: space-between;
//     height: 100%;
//   }
// }
// .theme--light .app-main-nav {
//   background-color: #e0e0e0;
// }
// .theme--dark .app-main-nav {
//   background-color: #000;
// }
// .app-sidebar-content {
//   display: flex;
//   flex-direction: column;
//   width: 100%;
//   height: 100%;
//   filter: blur(0);
//   transition: .2s all ease;
// }
// .v-navigation-drawer--mini-variant .app-sidebar-content {
//   filter: blur(100px);
//   overflow: hidden;
// }
// .theme--light .app-sidebar-content {
//   background-color: #f6f6f6;
// }
// .theme--dark .app-sidebar-content {
//   background-color: rgb(17, 17, 17);
// }
</style>