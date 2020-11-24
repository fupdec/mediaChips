<template>
	<v-app-bar app dense clipped-left :color="colorHeader" extension-height="28">
    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon tile @click="$store.state.Settings.dialogScanVideos=true" v-on="on">
            <v-icon>mdi-video-plus</v-icon>
          </v-btn>
        </template>
        <span>Add new videos</span>
      </v-tooltip>
    </div>

    <VideosAppbarActions />
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="openRandomVideo" icon tile v-on="on"> 
            <v-icon>mdi-dice-5</v-icon>
        </v-btn>
      </template>
      <span>Open random video</span>
    </v-tooltip>
    
    <v-spacer></v-spacer>

    <VideosAppbarCardView />
    
	
    <template v-slot:extension v-if="$store.getters.tabs.length">
      <Tabs />
    </template>
  </v-app-bar>
</template>


<script>
export default {
  name: 'VideosAppbar',
  components: {
    VideosAppbarActions: () => import('@/components/elements/VideosAppbarActions.vue'),
    VideosAppbarCardView: () => import('@/components/elements/VideosAppbarCardView.vue'),
    Tabs: () => import('@/components/elements/Tabs.vue'),
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
    colorHeader() {
      if (this.$vuetify.theme.isDark) {
        return this.$store.state.Settings.appColorDarkHeader
      } else return this.$store.state.Settings.appColorLightHeader
    },
  },
  methods: {
    openRandomVideo() {
      const rand = this.getRandomIntInclusive(1, this.$store.getters.videosTotal)
      const videoId = this.$store.getters.videos.value()[rand].id
      this.openVideoPage(videoId)
    },
    getRandomIntInclusive(min, max) {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    openVideoPage(videoId) {
      this.$router.push(`/video/:${videoId}?tabId=default`)
    },
  },
  watch: {
  },
}
</script>