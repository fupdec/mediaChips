<template>
	<v-app-bar app dense clipped-left :color="colorHeader" extension-height="32">
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
  },
  watch: {
  },
}
</script>