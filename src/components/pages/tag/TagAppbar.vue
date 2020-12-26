<template>
	<div class="app-bar-container">
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
	</div>
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
  },
  methods: {
  },
  watch: {
  },
}
</script>