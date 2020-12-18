<template>
	<v-app-bar app dense clipped-left extension-height="28" :style="{background: headerColor}">
    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Tags.dialogEditTag = true" 
            icon tile v-on="on"> 
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
        <span>Edit tag</span>
      </v-tooltip>
      <DialogEditTag v-if="$store.state.Tags.dialogEditTag"/>
    </div>

    <VideosAppbarActions v-if="$store.state.Tags.activeTab===0"/>
    <PerformersAppbarActions v-if="$store.state.Tags.activeTab===1"/>
    
    <v-spacer></v-spacer>

    <VideosAppbarCardView v-if="$store.state.Tags.activeTab===0"/>
    <PerformersAppbarCardView v-if="$store.state.Tags.activeTab===1"/>


    <template v-slot:extension v-if="$store.getters.tabs.length">
      <Tabs />
    </template>
	</v-app-bar>
</template>


<script>
export default {
  name: 'TagAppbar',
  components: {
    DialogEditTag: () => import('@/components/pages/tags/DialogEditTag.vue'),
    VideosAppbarActions: () => import('@/components/elements/VideosAppbarActions.vue'),
    VideosAppbarCardView: () => import('@/components/elements/VideosAppbarCardView.vue'),
    PerformersAppbarActions: () => import('@/components/elements/PerformersAppbarActions.vue'),
    PerformersAppbarCardView: () => import('@/components/elements/PerformersAppbarCardView.vue'),
    Tabs: () => import('@/components/elements/Tabs.vue'),
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
    tag() {
      return this.$store.getters.tags.find({ id: this.tagId }).value()    
    },
    tagId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    headerColor() {
      if (this.$store.state.Settings.headerGradient) {
        if (this.$vuetify.theme.isDark) {
          return this.$store.state.Settings.headerGradientDark
        } else return this.$store.state.Settings.headerGradientLight
      } else {
        if (this.$vuetify.theme.isDark) {
          return this.$store.state.Settings.appColorDarkHeader
        } else return this.$store.state.Settings.appColorLightHeader
      }
    },
  },
  methods: {
  },
  watch: {
  },
}
</script>