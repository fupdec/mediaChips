<template>
	<v-app-bar app dense clipped-left :color="colorHeader" extension-height="32">
    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Websites.dialogEditWebsite = true" 
            icon tile v-on="on"> 
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
        <span>Edit website</span>
      </v-tooltip>
      <DialogEditWebsite v-if="$store.state.Websites.dialogEditWebsite"/>
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
  name: 'WebsiteAppbar',
  components: {
    DialogEditWebsite: () => import("@/components/pages/websites/DialogEditWebsite.vue"),
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
    website() {
      return this.$store.getters.websites.find({ id: this.websiteId }).value()    
    },
    websiteId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
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