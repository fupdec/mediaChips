<template>
  <div class="app-bar-container">
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
    <v-divider vertical></v-divider>

    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Meta.dialogEditMetaCard=true" icon tile v-on="on"> 
            <v-icon>mdi-pencil</v-icon></v-btn>
        </template>
        <span>Edit {{meta.settings.nameSingular}}</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Meta.dialogEditMetaCardImages=true" icon tile v-on="on"> 
            <v-icon>mdi-image-edit-outline</v-icon></v-btn>
        </template>
        <span>Edit images</span>
      </v-tooltip>
      <!-- TODO add function for delete meta -->
    </div>
    
    <v-spacer></v-spacer>

    <VideosAppbarCardView />


    <DialogEditSingleMetaCard v-if="$store.state.Meta.dialogEditMetaCard"/>
    <DialogEditMetaCardImages v-if="$store.state.Meta.dialogEditMetaCardImages"/>
  </div>
</template>


<script>
import vuescroll from 'vuescroll'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'PerformerAppbar',
  components: {
    VideosAppbarActions: () => import('@/components/elements/VideosAppbarActions.vue'),
    VideosAppbarCardView: () => import('@/components/elements/VideosAppbarCardView.vue'),
    DialogEditSingleMetaCard: () => import('@/components/pages/meta/DialogEditSingleMetaCard.vue'),
    DialogEditMetaCardImages: () => import('@/components/pages/meta/DialogEditMetaCardImages.vue'),
    vuescroll,
  },
  mixins: [MetaGetters],
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogDeletePerformer: false,
    deleteVideos: false,
  }),
  computed: {
    metaCardId() { return this.$route.query.cardId },
    card() { return this.$store.getters.metaCards.find({id: this.metaCardId}).value() },
    tabId() { return this.$route.query.tabId },
  },
  methods: {
  },
  watch: {
  },
}
</script>


<style lang="less" scoped>
.colored {
  border-radius: 3px;
  background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red)
}
</style>